import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { useMoney } from '~/lib/hooks/use-money'
import { TFinanceEntryForm } from '~/lib/types/finance'

import { TEntryFormProperties } from './type'

export const ConvertedTotal = (
  properties: Pick<TEntryFormProperties, 'book' | 'currencies'>,
) => {
  const { book, currencies } = properties
  const { control } = useFormContext<TFinanceEntryForm>()
  const [currency, amount, quantity, rate] = useWatch({
    control,
    name: ['currency', 'amount', 'quantity', 'rate'],
  })
  const { t } = useTranslation()
  const money = useMoney()
  const isForeign = currency.code !== book.code
  const unitAmount = Number(amount)
  const units = Number(quantity)
  const exchangeRate = isForeign ? Number(rate) : 1
  const bookTotal = unitAmount * units * exchangeRate

  if (
    !Number.isFinite(bookTotal) ||
    unitAmount <= 0 ||
    units <= 0 ||
    exchangeRate <= 0
  )
    return null

  const defaultCurrency = currencies.find((option) => option.isDefault)
  const bookRate = currencies.find((option) => option.code === book.code)?.rate
  // The entered rate converts into the book. Use the person's settings only
  // for the extra preview when their default currency differs from the book.
  const defaultTotal =
    defaultCurrency &&
    defaultCurrency.code !== book.code &&
    defaultCurrency.code !== currency.code &&
    bookRate &&
    bookRate > 0 &&
    defaultCurrency.rate > 0
      ? (bookTotal * bookRate) / defaultCurrency.rate
      : undefined
  const showDefault =
    defaultTotal !== undefined && Number.isFinite(defaultTotal)

  if (!isForeign && !showDefault) return null

  return (
    <div
      role="status"
      aria-atomic="true"
      className="grid gap-1 rounded-lg border bg-muted/40 px-2 py-1.5 text-xs"
    >
      {isForeign && (
        <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-muted-foreground">
            {t('finances.form.convertedTotal.book', { code: book.code })}
          </span>
          <span className="font-semibold tabular-nums">
            {money(bookTotal, book)}
          </span>
        </p>
      )}
      {showDefault && defaultCurrency && (
        <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-muted-foreground">
            {t('finances.form.convertedTotal.default', {
              code: defaultCurrency.code,
            })}
          </span>
          <span className="font-semibold tabular-nums">
            {money(defaultTotal, defaultCurrency)}
          </span>
        </p>
      )}
    </div>
  )
}
