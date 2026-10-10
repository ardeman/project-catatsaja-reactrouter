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

const PLOT_HEIGHT = 168
const TOP = 8
const AXIS_BAND = 24
const LEFT = 44
const RADIUS = 4

// A column growing up (sign 1) or down (sign -1) from the baseline, with a
// rounded data end and a square foot.
const columnPath = (
  x: number,
  width: number,
  base: number,
  end: number,
  sign: 1 | -1,
) => {
  const height = Math.abs(base - end)
  if (height < 0.5) return ''
  const r = Math.min(RADIUS, width / 2, height)
  const tip = end + sign * r
  const sweep = sign === 1 ? 1 : 0
  return [
    `M${x},${base}`,
    `V${tip}`,
    `A${r},${r} 0 0 ${sweep} ${x + r},${end}`,
    `H${x + width - r}`,
    `A${r},${r} 0 0 ${sweep} ${x + width},${tip}`,
    `V${base}`,
    'Z',
  ].join(' ')
}

// Income above the line and expenses below it, one column pair per period.
export const CashFlowChart = ({ periods, granularity, book }: TProperties) => {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const { reference, width } = useElementWidth<HTMLDivElement>()
  const { index, setIndex, focusProps } = useChartCursor(periods.length)
  const compact = new Intl.NumberFormat(i18n.language, {
    notation: 'compact',
    maximumFractionDigits: 1,
  })

  const maxIncome = Math.max(0, ...periods.map((period) => period.income))
  const maxExpense = Math.max(0, ...periods.map((period) => period.expense))
  const ticks = niceTicks(-maxExpense, maxIncome)
  const top = ticks.at(-1) ?? 0
  const bottom = ticks[0] ?? 0
  const y = (value: number) =>
    TOP + ((top - value) / (top - bottom || 1)) * PLOT_HEIGHT
  const plotWidth = Math.max(width - LEFT, 0)
  const slot = plotWidth / Math.max(periods.length, 1)
  const barWidth = Math.min(24, Math.max(2, slot * 0.6))
  const base = y(0)
  const labelEvery = Math.ceil(
    periods.length / Math.max(Math.floor(plotWidth / 56), 1),
  )
  const height = TOP + PLOT_HEIGHT + AXIS_BAND
  const active = index === undefined ? undefined : periods[index]

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
          aria-label={t('finances.analysis.cashFlow.label')}
          className="block touch-pan-y outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring"
          {...focusProps}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={LEFT}
                x2={width}
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
          {periods.map((period, position) => {
            const center = LEFT + slot * position + slot / 2
            const x = center - barWidth / 2
            return (
              <g key={period.start}>
                {position === index && (
                  <rect
                    x={LEFT + slot * position}
                    y={TOP}
                    width={slot}
                    height={PLOT_HEIGHT}
                    className="fill-foreground/5"
                  />
                )}
                {/* 1px off the baseline each way: the surface gap between
                    the two columns. An empty side draws nothing. */}
                {period.income > 0 && (
                  <path
                    d={columnPath(x, barWidth, base - 1, y(period.income), 1)}
                    className="fill-viz-income"
                  />
                )}
                {period.expense > 0 && (
                  <path
                    d={columnPath(
                      x,
                      barWidth,
                      base + 1,
                      y(-period.expense),
                      -1,
                    )}
                    className="fill-viz-expense"
                  />
                )}
                {position % labelEvery === 0 && (
                  <text
                    x={center}
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
                )}
                {/* The whole slot is the hit target, not only the bars. */}
                <rect
                  x={LEFT + slot * position}
                  y={0}
                  width={slot}
                  height={height}
                  fill="transparent"
                  onPointerMove={() => setIndex(position)}
                  onPointerDown={() => setIndex(position)}
                />
              </g>
            )
          })}
        </svg>
      )}
      {active && index !== undefined && (
        <ChartTooltip
          start={active.start}
          granularity={granularity}
          rows={[
            {
              label: t('finances.summary.income'),
              value: money(active.income, book),
              color: 'var(--viz-income)',
            },
            {
              label: t('finances.summary.expense'),
              value: money(active.expense, book),
              color: 'var(--viz-expense)',
            },
            {
              label: t('finances.analysis.net'),
              value: money(active.income - active.expense, book, true),
            },
          ]}
          x={LEFT + slot * index + slot / 2}
          width={width}
        />
      )}
    </div>
  )
}
