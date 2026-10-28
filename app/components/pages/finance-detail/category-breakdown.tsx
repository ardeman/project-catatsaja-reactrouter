import { useTranslation } from 'react-i18next'

import { CategoryIcon } from '~/components/base/category-icon'
import { categoryColor } from '~/lib/constants/finance'
import { useMoney } from '~/lib/hooks/use-money'
import { TFinanceCurrency, TCategoryTotal } from '~/lib/types/finance'
import { formatShare } from '~/lib/utils/finance-analysis'

import { useShowAll } from './show-all'

type TProperties = {
  totals: TCategoryTotal[]
  book: TFinanceCurrency
}

// Largest first, each bar in its category's colour with the name, amount
// and share written beside it, so nothing depends on the colour. A thin
// stacked bar on top shows the whole split at a glance, in the rows' order,
// with gaps so neighbours that share a colour stay apart.
export const CategoryBreakdown = ({ totals, book }: TProperties) => {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const percent = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  })
  // The folded "other" row can be the largest.
  const largest = Math.max(0, ...totals.map((item) => item.total))
  const sum = totals.reduce((total, item) => total + item.total, 0)
  const { shown, button } = useShowAll(totals)

  return (
    <div className="grid gap-3">
      {sum > 0 && (
        <div
          aria-hidden="true"
          className="flex h-3 gap-0.5 overflow-hidden rounded-[4px]"
        >
          {totals.map(({ category, total }) => (
            <span
              key={category}
              className="min-w-0.5"
              style={{
                flexBasis: `${(total / sum) * 100}%`,
                backgroundColor: categoryColor(category),
              }}
            />
          ))}
        </div>
      )}
      <ul className="grid gap-3">
        {shown.map(({ category, total, share }) => {
          const label = t(
            category === 'rest'
              ? 'finances.analysis.categories.rest'
              : `finances.form.category.${category}.label`,
          )
          return (
            <li
              key={category}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 text-sm"
            >
              <CategoryIcon category={category} />
              <span className="truncate">{label}</span>
              <span className="text-right tabular-nums">
                <span className="font-medium">{money(total, book)}</span>{' '}
                <span className="text-xs text-muted-foreground">
                  {formatShare(percent, share)}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="col-start-2 col-end-4 h-2 rounded-r-[4px]"
                style={{
                  width: `${Math.max((total / (largest || 1)) * 100, 1)}%`,
                  backgroundColor: categoryColor(category),
                }}
              />
            </li>
          )
        })}
      </ul>
      {button}
    </div>
  )
}
