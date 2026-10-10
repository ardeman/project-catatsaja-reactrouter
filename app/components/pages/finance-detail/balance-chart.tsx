import { PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { useChartCursor } from '~/lib/hooks/use-chart-cursor'
import { useElementWidth } from '~/lib/hooks/use-element-width'
import { useMoney } from '~/lib/hooks/use-money'
import { TFinanceCurrency } from '~/lib/types/finance'
import {
  formatPeriod,
  niceTicks,
  TGranularity,
  TPeriod,
} from '~/lib/utils/finance-analysis'

import { ChartTooltip } from './chart-tooltip'

type TProperties = {
  periods: TPeriod[]
  granularity: TGranularity
  book: TFinanceCurrency
}

const PLOT_HEIGHT = 144
const TOP = 20
const AXIS_BAND = 24
const LEFT = 44
const RIGHT = 8

// The book's balance at the end of each period: a 2px line over a light
// wash, a crosshair that snaps to the nearest period, the latest value
// labelled at the end.
export const BalanceChart = ({ periods, granularity, book }: TProperties) => {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const { reference, width } = useElementWidth<HTMLDivElement>()
  const { index, setIndex, focusProps } = useChartCursor(periods.length)
  const compact = new Intl.NumberFormat(i18n.language, {
    notation: 'compact',
    maximumFractionDigits: 1,
  })

  const balances = periods.map((period) => period.balance)
  const ticks = niceTicks(Math.min(...balances), Math.max(...balances))
  const top = ticks.at(-1) ?? 0
  const bottom = ticks[0] ?? 0
  const y = (value: number) =>
    TOP + ((top - value) / (top - bottom || 1)) * PLOT_HEIGHT
  const plotWidth = Math.max(width - LEFT - RIGHT, 0)
  const slot = plotWidth / Math.max(periods.length, 1)
  const x = (position: number) => LEFT + slot * position + slot / 2
  const points = periods.map(
    (period, position) => `${x(position)},${y(period.balance)}`,
  )
  const line = `M${points.join(' L')}`
  const area = `${line} L${x(periods.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
  const labelEvery = Math.ceil(
    periods.length / Math.max(Math.floor(plotWidth / 56), 1),
  )
  const height = TOP + PLOT_HEIGHT + AXIS_BAND
  const last = periods.at(-1)
  const active = index === undefined ? undefined : periods[index]

  // The crosshair finds the period nearest the pointer.
  const handlePointer = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const position = Math.floor((event.clientX - box.left) / (slot || 1))
    setIndex(Math.min(Math.max(position, 0), periods.length - 1))
  }

  return (
    <div
      ref={reference}
      className="relative"
    >
      {width > 0 && last && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={t('finances.analysis.balance.label')}
          className="block touch-pan-y outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring"
          {...focusProps}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={LEFT}
                x2={width - RIGHT}
                y1={y(tick)}
                y2={y(tick)}
                className={
                  tick === 0 ? 'stroke-muted-foreground/40' : 'stroke-border'
                }
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
                {compact.format(tick)}
              </text>
            </g>
          ))}
          {periods.map(
            (period, position) =>
              position % labelEvery === 0 && (
                <text
                  key={period.start}
                  x={x(position)}
                  y={TOP + PLOT_HEIGHT + 16}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {formatPeriod({
                    start: period.start,
                    granularity,
                    locale: i18n.language,
                  })}
                </text>
              ),
          )}
          <path
            d={area}
            className="fill-viz-balance opacity-10"
          />
          <path
            d={line}
            fill="none"
            className="stroke-viz-balance"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
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
          {/* The end dot and the hovered dot, ringed in the surface colour. */}
          {[...new Set([periods.length - 1, index ?? periods.length - 1])].map(
            (position) => (
              <circle
                key={position}
                cx={x(position)}
                cy={y(periods[position].balance)}
                r={4}
                className="fill-viz-balance stroke-background"
                strokeWidth={2}
              />
            ),
          )}
          <text
            x={x(periods.length - 1)}
            y={y(last.balance) - 10}
            textAnchor={periods.length > 1 ? 'end' : 'middle'}
            // An outline in the surface colour keeps it readable where
            // the line runs through it.
            className="fill-foreground stroke-background text-[11px] font-medium tabular-nums"
            strokeWidth={3}
            paintOrder="stroke"
          >
            {money(last.balance, book, last.balance < 0)}
          </text>
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
          start={active.start}
          granularity={granularity}
          rows={[
            {
              label: t('finances.summary.balance'),
              value: money(active.balance, book, active.balance < 0),
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
