import { PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { ChartTooltip } from '~/components/base/chart-tooltip'
import { useChartCursor } from '~/lib/hooks/use-chart-cursor'
import { useElementWidth } from '~/lib/hooks/use-element-width'

export type TMetricPoint = { date: string; time?: string; value: number }

type TProperties = {
  // Oldest first.
  points: TMetricPoint[]
  label: string
  format: (value: number) => string
  // The normal range, shaded behind the line.
  band?: { low?: number; high?: number }
}

const PLOT_HEIGHT = 140
const TOP = 12
const AXIS_BAND = 24
const LEFT = 40
const RIGHT = 10

const toTime = (point: TMetricPoint) =>
  Date.parse(`${point.date}T${point.time ?? '12:00'}:00Z`)

// Round ticks around the data (not from 0: a weight of 70 kg needs no
// empty axis below it).
const niceRange = (min: number, max: number) => {
  const span = max - min || Math.abs(max) || 1
  const rough = span / 4
  const power = 10 ** Math.floor(Math.log10(rough))
  const step =
    [1, 2, 2.5, 5, 10]
      .map((factor) => factor * power)
      .find((s) => s >= rough) ?? 10 * power
  const low = Math.floor(min / step) * step
  const high = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let tick = low; tick <= high + step / 2; tick += step)
    ticks.push(Number(tick.toPrecision(10)))
  return ticks
}

// One measurement over time: a 2px line through the points (placed by
// date), the normal range as a light band, a crosshair that snaps to the
// nearest point.
export const MetricChart = ({ points, label, format, band }: TProperties) => {
  const { i18n } = useTranslation()
  const { reference, width } = useElementWidth<HTMLDivElement>()
  const { index, setIndex, focusProps } = useChartCursor(points.length)
  const values = points.map((point) => point.value)
  const ticks = niceRange(
    Math.min(...values, band?.low ?? Infinity),
    Math.max(...values, band?.high ?? -Infinity),
  )
  const top = ticks.at(-1) ?? 0
  const bottom = ticks[0] ?? 0
  const y = (value: number) =>
    TOP + ((top - value) / (top - bottom || 1)) * PLOT_HEIGHT
  const times = points.map((point) => toTime(point))
  const first = times[0] ?? 0
  const last = times.at(-1) ?? 0
  const plotWidth = Math.max(width - LEFT - RIGHT, 0)
  const x = (position: number) =>
    last === first
      ? LEFT + plotWidth / 2
      : LEFT + ((times[position] - first) / (last - first)) * plotWidth
  const height = TOP + PLOT_HEIGHT + AXIS_BAND
  const dateLabel = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
  const longDate = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const line = points
    .map((point, position) => `${x(position)},${y(point.value)}`)
    .join(' L')
  const active = index === undefined ? undefined : points[index]
  // Up to four date labels: first, last and evenly between.
  const labelled = [
    ...new Set(
      [0, 1, 2, 3].map((step) =>
        Math.round((step / 3) * Math.max(points.length - 1, 0)),
      ),
    ),
  ]

  const handlePointer = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const pointer = event.clientX - box.left + LEFT
    let nearest = 0
    for (const position of points.keys())
      if (Math.abs(x(position) - pointer) < Math.abs(x(nearest) - pointer))
        nearest = position
    setIndex(nearest)
  }

  return (
    <div
      ref={reference}
      className="relative"
    >
      {width > 0 && points.length > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={label}
          className="block touch-pan-y outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring"
          {...focusProps}
        >
          {band && (
            <rect
              x={LEFT}
              width={plotWidth}
              y={y(Math.min(band.high ?? top, top))}
              height={Math.max(
                y(Math.max(band.low ?? bottom, bottom)) -
                  y(Math.min(band.high ?? top, top)),
                0,
              )}
              className="fill-emerald-500/10"
            />
          )}
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={LEFT}
                x2={width - RIGHT}
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-border"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={LEFT - 6}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {Number(tick.toFixed(2))}
              </text>
            </g>
          ))}
          {labelled.map((position) => (
            <text
              key={position}
              x={x(position)}
              y={TOP + PLOT_HEIGHT + 16}
              textAnchor={
                points.length === 1
                  ? 'middle'
                  : position === 0
                    ? 'start'
                    : position === points.length - 1
                      ? 'end'
                      : 'middle'
              }
              className="fill-muted-foreground text-[10px]"
            >
              {dateLabel.format(new Date(`${points[position].date}T00:00:00Z`))}
            </text>
          ))}
          {points.length > 1 && (
            <path
              d={`M${line}`}
              fill="none"
              className="stroke-viz-balance"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {index !== undefined && (
            <line
              x1={x(index)}
              x2={x(index)}
              y1={TOP}
              y2={TOP + PLOT_HEIGHT}
              className="stroke-muted-foreground/60"
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
          )}
          {points.map((point, position) => (
            <circle
              key={`${point.date}-${point.time}-${position}`}
              cx={x(position)}
              cy={y(point.value)}
              r={position === index ? 5 : 3.5}
              className="fill-viz-balance stroke-background"
              strokeWidth={2}
            />
          ))}
          <rect
            x={LEFT}
            y={0}
            width={plotWidth}
            height={height}
            fill="transparent"
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
          />
        </svg>
      )}
      {active && index !== undefined && (
        <ChartTooltip
          title={`${longDate.format(new Date(`${active.date}T00:00:00Z`))}${active.time ? ` · ${active.time}` : ''}`}
          rows={[
            {
              label,
              value: format(active.value),
              color: 'var(--viz-balance)',
            },
          ]}
          x={x(index)}
          width={width}
        />
      )}
    </div>
  )
}
