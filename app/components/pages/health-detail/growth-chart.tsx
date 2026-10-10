import { PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { ChartTooltip } from '~/components/base/chart-tooltip'
import { useChartCursor } from '~/lib/hooks/use-chart-cursor'
import { useElementWidth } from '~/lib/hooks/use-element-width'
import { THealthSex } from '~/lib/types/health'
import {
  assessGrowth,
  growthMaxDay,
  lmsAt,
  TGrowthIndicator,
  TGrowthStandards,
  valueAtZ,
} from '~/lib/utils/growth'

type TProperties = {
  standards: TGrowthStandards
  indicator: TGrowthIndicator
  sex: THealthSex
  // Age in days and the measurement, oldest first.
  points: { day: number; value: number }[]
  label: string
  unit: string
}

const PLOT_HEIGHT = 200
const TOP = 12
const AXIS_BAND = 24
const LEFT = 36
const RIGHT = 28
const DAYS_PER_MONTH = 30.4375

// The WHO lines: the median, ±2 and ±3 SD. Between ±2 is the usual range.
const LINES = [-3, -2, 0, 2, 3] as const

// A child's measurements against the WHO standard for their sex: the
// reference lines by age, the child's points joined in order.
export const GrowthChart = ({
  standards,
  indicator,
  sex,
  points,
  label,
  unit,
}: TProperties) => {
  const { t, i18n } = useTranslation()
  const { reference, width } = useElementWidth<HTMLDivElement>()
  const { index, setIndex, focusProps } = useChartCursor(points.length)
  const table = standards[indicator][sex]
  // From birth to a little past the latest measurement (at least a year).
  const lastDay = Math.max(...points.map((point) => point.day), 0)
  const endDay = Math.min(Math.max(lastDay + 90, 365), growthMaxDay)
  const samples = Array.from({ length: 60 }, (_, step) =>
    Math.round((step / 59) * endDay),
  )
  const curves = LINES.map((z) => ({
    z,
    values: samples.map((day) => {
      const lms = lmsAt(table, day)
      return lms ? valueAtZ(lms, z) : 0
    }),
  }))
  const all = [
    ...curves.flatMap((curve) => curve.values),
    ...points.map((point) => point.value),
  ]
  const low = Math.floor(Math.min(...all))
  const high = Math.ceil(Math.max(...all))
  const y = (value: number) =>
    TOP + ((high - value) / (high - low || 1)) * PLOT_HEIGHT
  const plotWidth = Math.max(width - LEFT - RIGHT, 0)
  const x = (day: number) => LEFT + (day / (endDay || 1)) * plotWidth
  const height = TOP + PLOT_HEIGHT + AXIS_BAND
  const number = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 1,
  })
  const monthStep = endDay > 730 ? 12 : endDay > 365 ? 6 : 3
  const months = Array.from(
    { length: Math.floor(endDay / DAYS_PER_MONTH / monthStep) + 1 },
    (_, step) => step * monthStep,
  )
  const yTicks = Array.from({ length: 5 }, (_, step) =>
    Math.round(low + ((high - low) * step) / 4),
  )
  const active = index === undefined ? undefined : points[index]
  const activeAssessment =
    active &&
    assessGrowth({
      standards,
      indicator,
      sex,
      day: active.day,
      value: active.value,
    })

  const handlePointer = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const pointer = event.clientX - box.left + LEFT
    let nearest = 0
    for (const [position, point] of points.entries())
      if (
        Math.abs(x(point.day) - pointer) <
        Math.abs(x(points[nearest].day) - pointer)
      )
        nearest = position
    setIndex(nearest)
  }

  return (
    <div
      ref={reference}
      className="relative"
    >
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={label}
          className="block touch-pan-y outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring"
          {...(points.length > 0 && focusProps)}
        >
          {/* The usual range (−2 to +2 SD), lightly shaded. */}
          <path
            d={`M${samples.map((day, step) => `${x(day)},${y(curves[3].values[step])}`).join(' L')} L${samples
              .toReversed()
              .map(
                (day, step) =>
                  `${x(day)},${y(curves[1].values[samples.length - 1 - step])}`,
              )
              .join(' L')} Z`}
            className="fill-emerald-500/10"
          />
          {yTicks.map((tick) => (
            <text
              key={tick}
              x={LEFT - 6}
              y={y(tick)}
              dy="0.32em"
              textAnchor="end"
              className="fill-muted-foreground text-[10px] tabular-nums"
            >
              {tick}
            </text>
          ))}
          {months.map((month) => (
            <g key={month}>
              <line
                x1={x(month * DAYS_PER_MONTH)}
                x2={x(month * DAYS_PER_MONTH)}
                y1={TOP}
                y2={TOP + PLOT_HEIGHT}
                className="stroke-border"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={x(month * DAYS_PER_MONTH)}
                y={TOP + PLOT_HEIGHT + 16}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {month}
              </text>
            </g>
          ))}
          {curves.map(({ z, values }) => (
            <g key={z}>
              <path
                d={`M${samples.map((day, step) => `${x(day)},${y(values[step])}`).join(' L')}`}
                fill="none"
                className={
                  z === 0
                    ? 'stroke-emerald-600 dark:stroke-emerald-400'
                    : Math.abs(z) === 2
                      ? 'stroke-amber-500'
                      : 'stroke-destructive-text'
                }
                strokeWidth={z === 0 ? 1.5 : 1}
                strokeOpacity={0.7}
              />
              <text
                x={width - RIGHT + 4}
                y={y(values.at(-1) ?? 0)}
                dy="0.32em"
                className="fill-muted-foreground text-[10px]"
              >
                {z > 0 ? `+${z}` : z}
              </text>
            </g>
          ))}
          {points.length > 1 && (
            <path
              d={`M${points.map((point) => `${x(point.day)},${y(point.value)}`).join(' L')}`}
              fill="none"
              className="stroke-viz-balance"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {points.map((point, position) => (
            <circle
              key={`${point.day}-${position}`}
              cx={x(point.day)}
              cy={y(point.value)}
              r={position === index ? 5 : 4}
              className="fill-viz-balance stroke-background"
              strokeWidth={2}
            />
          ))}
          {points.length > 0 && (
            <rect
              x={LEFT}
              y={0}
              width={plotWidth}
              height={height}
              fill="transparent"
              onPointerMove={handlePointer}
              onPointerDown={handlePointer}
            />
          )}
        </svg>
      )}
      <p className="mt-1 text-[11px] text-muted-foreground">
        {t('health.growth.axis', { unit })}
      </p>
      {active && index !== undefined && (
        <ChartTooltip
          title={t('health.growth.ageMonths', {
            count: Math.floor(active.day / DAYS_PER_MONTH),
          })}
          rows={[
            {
              label,
              value: `${number.format(active.value)} ${unit}`,
              color: 'var(--viz-balance)',
            },
            ...(activeAssessment
              ? [
                  {
                    label: t('health.growth.percentileLabel'),
                    value: number.format(activeAssessment.percentile),
                  },
                ]
              : []),
          ]}
          x={x(active.day)}
          width={width}
        />
      )}
    </div>
  )
}
