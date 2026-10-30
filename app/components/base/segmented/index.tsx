import { ReactNode } from 'react'

import { cn } from '~/lib/utils/shadcn'

// A small switch between a few views (Entries/Analysis, Chart/Table),
// in the app's rounded style.
export const Segmented = <TValue extends string>({
  label,
  value,
  options,
  onChange,
  className,
  guide,
}: {
  label: string
  value: TValue
  // An icon shows before the label (e.g. ♀ and ♂ in their colours).
  options: { value: TValue; label: string; icon?: ReactNode }[]
  onChange: (value: TValue) => void
  className?: string
  // Marks it for a page's screen guide.
  guide?: string
}) => (
  <div
    role="group"
    data-guide={guide}
    aria-label={label}
    className={cn(
      'inline-flex rounded-full border bg-muted/60 p-0.5 text-xs',
      className,
    )}
  >
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-3 py-1 whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
          value === option.value
            ? 'bg-background font-medium text-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {option.icon}
        {option.label}
      </button>
    ))}
  </div>
)
