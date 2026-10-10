import { useTranslation } from 'react-i18next'

import { formatPeriod, TGranularity } from '~/lib/utils/finance-analysis'
import { cn } from '~/lib/utils/shadcn'

type TRow = {
  label: string
  value: string
  // A CSS colour for the row's line key; none for derived values (net).
  color?: string
}

type TProperties = {
  // The period shown: its first day and how long it is.
  start: string
  granularity: TGranularity
  rows: TRow[]
  // Horizontal centre in pixels, and the chart's width to keep it inside.
  x: number
  width: number
}

const TOOLTIP_WIDTH = 176

// The hover and keyboard readout of one period: values lead, names follow,
// each series keyed by a short stroke of its colour.
export const ChartTooltip = ({
  start,
  granularity,
  rows,
  x,
  width,
}: TProperties) => {
  const { t, i18n } = useTranslation()
  const date = formatPeriod({
    start,
    granularity,
    locale: i18n.language,
    withYear: true,
  })
  const title =
    granularity === 'week' ? t('finances.analysis.weekOf', { date }) : date
  const left = Math.min(
    Math.max(x - TOOLTIP_WIDTH / 2, 0),
    Math.max(width - TOOLTIP_WIDTH, 0),
  )
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-0 z-10 grid gap-1 rounded-lg border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md"
      style={{ left, width: TOOLTIP_WIDTH }}
    >
      <p className="text-muted-foreground">{title}</p>
      {rows.map((row) => (
        <p
          key={row.label}
          className="flex items-center gap-2"
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-0.5 w-3 shrink-0 rounded-full',
              !row.color && 'invisible',
            )}
            style={{ backgroundColor: row.color }}
          />
          <span className="font-semibold tabular-nums">{row.value}</span>
          <span className="truncate text-muted-foreground">{row.label}</span>
        </p>
      ))}
    </div>
  )
}
