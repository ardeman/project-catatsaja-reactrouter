import { useTranslation } from 'react-i18next'

import { categoryColor } from '~/lib/constants/finance'

type TProperties = {
  // Expense totals by category, largest first ("rest" for the folded
  // smaller ones, shown neutral).
  segments: { category: string; total: number }[]
}

// A book's spending by category at a glance: one thin bar, each segment in
// its category's colour, with a surface gap between them. A summary of the
// entries listed beside it (and of the book's analysis), so it is hidden
// from screen readers.
export const CategoryBar = ({ segments }: TProperties) => {
  const { t } = useTranslation()
  if (segments.length === 0) return null
  return (
    <div
      aria-hidden="true"
      className="grid gap-1"
    >
      <p className="text-xs text-muted-foreground">
        {t('finances.summary.byCategory')}
      </p>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        {segments.map(({ category, total }) => (
          <span
            key={category}
            className="min-w-1"
            style={{
              flexGrow: total,
              backgroundColor: categoryColor(category),
            }}
          />
        ))}
      </div>
    </div>
  )
}
