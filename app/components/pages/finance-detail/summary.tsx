import { useTranslation } from 'react-i18next'

import { useMoney } from '~/lib/hooks/use-money'
import { TFinanceAccount, TFinanceCurrency } from '~/lib/types/finance'
import { accountsDifference } from '~/lib/utils/finance'
import { cn } from '~/lib/utils/shadcn'

type TProperties = {
  book: TFinanceCurrency
  income: number
  expense: number
  balance: number
  accounts: TFinanceAccount[]
  // Scrolled past: only the balance and its difference from the accounts
  // (which have scrolled away), on one line, so the book can be checked
  // against them while reading or adding entries.
  isCompact: boolean
}

// The book's totals, at the top of the summary card.
export const Summary = (properties: TProperties) => {
  const { book, income, expense, balance, accounts, isCompact } = properties
  const { t } = useTranslation()
  const money = useMoney()

  if (!isCompact)
    return (
      <dl className="grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-xs text-muted-foreground">
            {t('finances.summary.balance')}
          </dt>
          <dd
            className={cn(
              'text-lg font-semibold tabular-nums',
              balance < 0 && 'text-destructive-text',
            )}
          >
            {money(balance, book, balance < 0)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">
            {t('finances.summary.income')}
          </dt>
          <dd className="font-medium text-income tabular-nums">
            {money(income, book)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">
            {t('finances.summary.expense')}
          </dt>
          <dd className="font-medium text-expense tabular-nums">
            {money(expense, book)}
          </dd>
        </div>
      </dl>
    )

  const difference =
    accounts.length > 0
      ? accountsDifference(accounts, balance, book.maximumFractionDigits)
      : undefined
  const items = [
    {
      label: t('finances.summary.balance'),
      value: money(balance, book, balance < 0),
      className: cn('font-semibold', balance < 0 && 'text-destructive-text'),
    },
    ...(difference === undefined
      ? []
      : [
          {
            label: t('finances.summary.difference'),
            value: money(difference, book, true),
            className:
              difference === 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-destructive-text',
          },
        ]),
  ]

  return (
    <dl
      className={cn(
        'grid gap-x-4 gap-y-0.5',
        items.length === 2 ? 'grid-cols-2' : 'grid-cols-1',
      )}
    >
      {items.map(({ label, value, className }) => (
        <div
          key={label}
          className="flex min-w-0 items-baseline justify-between gap-2 sm:grid sm:justify-start sm:gap-0"
        >
          <dt className="truncate text-xs text-muted-foreground">{label}</dt>
          <dd
            className={cn(
              'text-sm font-medium whitespace-nowrap tabular-nums',
              className,
            )}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
