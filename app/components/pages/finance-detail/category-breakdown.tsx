import { useTranslation } from 'react-i18next'

import { CategoryIcon } from '~/components/base/category-icon'
import { categoryColor } from '~/lib/constants/finance'
import { useMoney } from '~/lib/hooks/use-money'
import { TFinanceCurrency } from '~/lib/types/finance'
import { TCategoryTotal } from '~/lib/utils/finance-analysis'

type TProperties = {
  totals: TCategoryTotal[]
  book: TFinanceCurrency
}

// Largest first, each bar in its category's colour with the name, amount
// and share written beside it, so nothing depends on the colour.
export const CategoryBreakdown = ({ totals, book }: TProperties) => {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const percent = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  })
  // The folded "other" row can be the largest.
  const largest = Math.max(0, ...totals.map((item) => item.total))

  return (
    <ul className="grid gap-3">
      {totals.map(({ category, total, share }) => {
        const label =
          category === 'rest'
            ? t('finances.analysis.categories.rest')
            : t(`finances.form.category.${category}.label`)
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
                {percent.format(share)}
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
  )
}
