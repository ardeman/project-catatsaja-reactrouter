import { useTranslation } from 'react-i18next'

import { useChartCursor } from '~/lib/hooks/use-chart-cursor'
import { useElementWidth } from '~/lib/hooks/use-element-width'
import { useMoney } from '~/lib/hooks/use-money'
import { TFinanceCurrency } from '~/lib/types/finance'
import {
  formatPeriod,
  niceTicks,
  scaleLimit,
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
const AXIS_BAND = 24
// Room for the value of a column cut off at the top or bottom.
const CUT_LABEL = 14
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

// A column cut off at the edge of the plot: a break across it near the end,
// and its value past the end.
const CutMark = ({
  x,
  width,
  end,
  sign,
  label,
}: {
  x: number
  width: number
  end: number
  sign: 1 | -1
  label: string
}) => {
  const at = end + sign * 12
  return (
    <>
      {[0, 4].map((offset) => (
        <line
          key={offset}
          x1={x - 1}
          x2={x + width + 1}
          y1={at + sign * offset + 2}
          y2={at + sign * offset - 2}
          className="stroke-card"
          strokeWidth={1.5}
        />
      ))}
      <text
        x={x + width / 2}
        y={end - sign * 5}
        dy={sign === 1 ? 0 : '0.7em'}
        textAnchor="middle"
        className="fill-foreground text-[10px] font-medium tabular-nums"
      >
        {label}
      </text>
    </>
  )
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

  // A day far above the rest (a salary) would flatten every other column:
  // the scale follows the others and it is drawn cut off, with its value.
  // One limit for both sides, so income and expenses share a scale and a
  // column is cut off only when it dwarfs the other side too.
  const incomes = periods.map((period) => period.income)
  const expenses = periods.map((period) => period.expense)
  const limit = scaleLimit([...incomes, ...expenses])
  const ticks = niceTicks(
    -Math.min(Math.max(0, ...expenses), limit),
    Math.min(Math.max(0, ...incomes), limit),
  )
  const top = ticks.at(-1) ?? 0
  const bottom = ticks[0] ?? 0
  const isCutAbove = periods.some((period) => period.income > top)
  const isCutBelow = periods.some((period) => period.expense > -bottom)
  const TOP = isCutAbove ? 8 + CUT_LABEL : 8
  const plotBottom = TOP + PLOT_HEIGHT + (isCutBelow ? CUT_LABEL : 0)
  const y = (value: number) =>
    TOP +
    ((top - Math.min(Math.max(value, bottom), top)) / (top - bottom || 1)) *
      PLOT_HEIGHT
  const plotWidth = Math.max(width - LEFT, 0)
  const slot = plotWidth / Math.max(periods.length, 1)
  const barWidth = Math.min(24, Math.max(2, slot * 0.6))
  const base = y(0)
  const labelEvery = Math.ceil(
    periods.length / Math.max(Math.floor(plotWidth / 56), 1),
  )
  const height = plotBottom + AXIS_BAND
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
                {period.income > top && (
                  <CutMark
                    x={x}
                    width={barWidth}
                    end={y(top)}
                    sign={1}
                    label={compact.format(period.income)}
                  />
                )}
                {period.expense > -bottom && (
                  <CutMark
                    x={x}
                    width={barWidth}
                    end={y(bottom)}
                    sign={-1}
                    label={compact.format(-period.expense)}
                  />
                )}
                {position % labelEvery === 0 && (
                  <text
                    x={center}
                    y={plotBottom + 16}
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
