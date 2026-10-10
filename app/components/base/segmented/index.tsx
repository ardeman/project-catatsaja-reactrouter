import { cn } from '~/lib/utils/shadcn'

// A small switch between a few views (Entries/Analysis, Chart/Table),
// in the app's rounded style.
export const Segmented = <TValue extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: TValue
  options: { value: TValue; label: string }[]
  onChange: (value: TValue) => void
}) => (
  <div
    role="group"
    aria-label={label}
    className="inline-flex rounded-full border bg-muted/60 p-0.5 text-xs"
  >
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
        className={cn(
          'rounded-full px-3 py-1 whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
          value === option.value
            ? 'bg-background font-medium text-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
)
