import { Calculator, X } from 'lucide-react'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Difference, differenceClassName } from '~/components/base/difference'
import { Button } from '~/components/ui/button'
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
  // Compact only: each part scrolls back to where it's shown in full.
  onSelect?: (part: TSummaryPart) => void
  // The entries ticked by their icon: how many, and income less expenses.
  selected?: TSelectedSum
  onClearSelected?: () => void
  // Adds the selected sum to the floating calculator.
  onCalculate?: (total: number) => void
}

type TSelectedSum = { count: number; total: number }

export type TSummaryPart = 'balance' | 'difference'

// The book's totals, at the top of the summary card.
export const Summary = (properties: TProperties) => {
  const {
    book,
    income,
    expense,
    balance,
    accounts,
    isCompact,
    onSelect,
    selected,
    onClearSelected,
    onCalculate,
  } = properties
  const { t } = useTranslation()
  const money = useMoney()

  const selectedSum = selected && selected.count > 0 && (
    <div className="col-span-full flex min-w-0 items-center justify-between gap-2 border-t pt-1">
      <dt className="flex min-w-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          aria-label={t('finances.selected.clear')}
          title={t('finances.selected.clear')}
          onClick={onClearSelected}
        >
          <X className="size-4" />
        </Button>
        <span className="truncate text-xs text-muted-foreground">
          {t('finances.selected.label', { count: selected.count })}
        </span>
      </dt>
      <dd className="flex items-center gap-1">
        <span
          className={cn(
            'text-sm font-semibold whitespace-nowrap tabular-nums',
            selected.total < 0 ? 'text-expense' : 'text-income',
          )}
        >
          {money(selected.total, book, true)}
        </span>
        {onCalculate && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            aria-label={t('finances.selected.calculate')}
            title={t('finances.selected.calculate')}
            onClick={() => onCalculate(selected.total)}
          >
            <Calculator className="size-4" />
          </Button>
        )}
      </dd>
    </div>
  )

  if (!isCompact)
    return (
      // Sized by its card (`@container`), so the narrow side column of wide
      // screens gets two columns, as a phone does.
      <dl className="grid grid-cols-2 gap-x-2 gap-y-3 @sm:grid-cols-3">
        <div className="col-span-2 @sm:col-span-1">
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
        {selectedSum}
      </dl>
    )

  const difference =
    accounts.length > 0
      ? accountsDifference(accounts, balance, book.maximumFractionDigits)
      : undefined
  const items: {
    part: TSummaryPart
    label: string
    value: ReactNode
    className: string
  }[] = [
    {
      part: 'balance',
      label: t('finances.summary.balance'),
      value: money(balance, book, balance < 0),
      className: cn('font-semibold', balance < 0 && 'text-destructive-text'),
    },
    ...(difference === undefined
      ? []
      : [
          {
            part: 'difference' as const,
            label: t('finances.summary.difference'),
            value: (
              <Difference
                difference={difference}
                book={book}
              />
            ),
            className: differenceClassName(difference),
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
      {items.map(({ part, label, value, className }) => (
        <div
          key={part}
          className="relative flex min-w-0 items-baseline justify-between gap-2 sm:grid sm:justify-start sm:gap-0"
        >
          <dt className="truncate text-xs text-muted-foreground">
            {onSelect ? (
              // The button covers the whole part, so the value is
              // clickable too.
              <button
                type="button"
                className="rounded-sm after:absolute after:-inset-1 after:rounded-md hover:after:bg-foreground/5 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
                onClick={() => onSelect(part)}
              >
                {label}
              </button>
            ) : (
              label
            )}
          </dt>
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
      {selectedSum}
    </dl>
  )
}
