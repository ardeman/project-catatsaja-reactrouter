import { useTranslation } from 'react-i18next'

import { CategoryIcon } from '~/components/base/category-icon'
import { useMoney } from '~/lib/hooks/use-money'
import { TFinanceCurrency, TFinanceEntry } from '~/lib/types/finance'
import { summarize } from '~/lib/utils/finance'
import { compareCategories } from '~/lib/utils/finance-analysis'
import { cn } from '~/lib/utils/shadcn'

type TProperties = {
  current: TFinanceEntry[]
  previous: TFinanceEntry[]
  // The types whose categories are compared, as chosen above the
  // breakdowns: expenses first when both are.
  types: TFinanceEntry['type'][]
  book: TFinanceCurrency
}

type TRow = {
  key: string
  label: string
  category?: string
  current: number
  previous: number
  // Income and net going up is good; an expense going up is not.
  higherIsGood: boolean
  isTotal?: boolean
  // The first category of its type, set apart from the rows above.
  startsType?: boolean
}

// The range's income, expense, net and categories beside the range it is
// compared with, and how much each changed.
export const PeriodComparison = ({
  current,
  previous,
  types,
  book,
}: TProperties) => {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const percent = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
    signDisplay: 'exceptZero',
  })
  const now = summarize(current)
  const before = summarize(previous)
  const rows: TRow[] = [
    {
      key: 'income',
      label: t('finances.summary.income'),
      current: now.income,
      previous: before.income,
      higherIsGood: true,
      isTotal: true,
    },
    {
      key: 'expense',
      label: t('finances.summary.expense'),
      current: now.expense,
      previous: before.expense,
      higherIsGood: false,
      isTotal: true,
    },
    {
      key: 'net',
      label: t('finances.analysis.net'),
      current: now.balance,
      previous: before.balance,
      higherIsGood: true,
      isTotal: true,
    },
    ...types.flatMap((type) =>
      compareCategories(current, previous, type).map((item, index) => ({
        key: `category-${type}-${item.category}`,
        label: t(
          item.category === 'rest'
            ? 'finances.analysis.categories.rest'
            : `finances.form.category.${item.category}.label`,
        ),
        category: item.category,
        current: item.current,
        previous: item.previous,
        higherIsGood: type === 'income',
        startsType: index === 0,
      })),
    ),
  ]

  // Two lines a row, so the change stays in view on a phone.
  return (
    <ul className="grid text-sm tabular-nums">
      {rows.map((row) => {
        const change = row.current - row.previous
        // A share means little when it started from nothing or below it.
        const share = row.previous > 0 ? change / row.previous : undefined
        const isGood = row.higherIsGood ? change > 0 : change < 0
        const isSigned = row.key === 'net'
        return (
          <li
            key={row.key}
            className={cn(
              'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 border-b py-2 last:border-0',
              row.startsType && 'border-t-2',
            )}
          >
            <span
              className={cn(
                'flex min-w-0 items-center gap-2',
                row.isTotal && 'font-medium',
              )}
            >
              {row.category && <CategoryIcon category={row.category} />}
              <span className="truncate">{row.label}</span>
            </span>
            <span className="text-right font-medium whitespace-nowrap">
              {money(row.current, book, isSigned)}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {t('finances.analysis.compare.was', {
                amount: money(row.previous, book, isSigned),
              })}
            </span>
            <span
              className={cn(
                'text-right text-xs whitespace-nowrap',
                change === 0
                  ? 'text-muted-foreground'
                  : isGood
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-destructive-text',
              )}
            >
              {change === 0
                ? t('finances.analysis.compare.same')
                : money(change, book, true)}
              {change !== 0 &&
                (share === undefined
                  ? !isSigned &&
                    row.previous === 0 &&
                    ` · ${t('finances.analysis.compare.new')}`
                  : ` · ${percent.format(share)}`)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
