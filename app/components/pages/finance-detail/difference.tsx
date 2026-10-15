import { Check } from 'lucide-react'

import { useMoney } from '~/lib/hooks/use-money'
import { TFinanceCurrency } from '~/lib/types/finance'

// The accounts' difference from the book, coloured like entries: more in
// the accounts (possibly unrecorded income) in the income colour, less
// (possibly unrecorded expenses) in the expense colour, with its sign; a
// match in the text colour with a green check mark.
export const differenceClassName = (difference: number) =>
  difference === 0
    ? 'text-foreground'
    : difference > 0
      ? 'text-income'
      : 'text-expense'

export const Difference = ({
  difference,
  book,
}: {
  difference: number
  book: TFinanceCurrency
}) => {
  const money = useMoney()
  return (
    <>
      {difference === 0 && (
        <Check
          aria-hidden="true"
          className="mr-1 inline size-3.5 align-[-0.125em] text-income"
        />
      )}
      {money(difference, book, true)}
    </>
  )
}
