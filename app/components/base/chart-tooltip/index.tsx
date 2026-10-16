import { tooltipSurface } from '~/components/base/tooltip'
import { cn } from '~/lib/utils/shadcn'

export type TChartTooltipRow = {
  label: string
  value: string
  // A CSS colour for the row's line key; none for derived values (net).
  color?: string
}

type TProperties = {
  title: string
  rows: TChartTooltipRow[]
  // Horizontal centre in pixels, and the chart's width to keep it inside.
  x: number
  width: number
}

const TOOLTIP_WIDTH = 224

// A chart's hover and keyboard readout of one point, with each label above
// its amount so long currencies and translated labels don't compete for space.
export const ChartTooltip = ({ title, rows, x, width }: TProperties) => {
  const tooltipWidth = Math.min(TOOLTIP_WIDTH, width)
  const left = Math.min(
    Math.max(x - tooltipWidth / 2, 0),
    Math.max(width - tooltipWidth, 0),
  )
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        tooltipSurface,
        'pointer-events-none absolute top-0 z-10 grid gap-2',
      )}
      style={{ left, width: tooltipWidth }}
    >
      <p className="text-muted-foreground">{title}</p>
      {rows.map((row) => (
        <p
          key={row.label}
          className="grid grid-cols-[0.75rem_minmax(0,1fr)] items-center gap-x-2"
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-0.5 w-3 shrink-0 rounded-full',
              !row.color && 'invisible',
            )}
            style={{ backgroundColor: row.color }}
          />
          <span className="text-muted-foreground">{row.label}</span>
          <span className="col-start-2 text-sm leading-snug font-semibold [overflow-wrap:anywhere] tabular-nums">
            {row.value}
          </span>
        </p>
      ))}
    </div>
  )
}
