import { useEffect, useRef } from 'react'
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { NumberInput } from '~/components/base/number-input'
import { useMoney } from '~/lib/hooks/use-money'
import { TFinanceEntryForm } from '~/lib/types/finance'

import { TEntryFormProperties } from './type'

type TLinked = 'amount' | 'rate' | 'total'

// Least recently touched first. Typing the amount works out the total (as
// before); typing the total keeps the rate and works out the amount; then
// typing the amount works out the rate.
const initialOrder: TLinked[] = ['total', 'amount', 'rate']

const isPositive = (value: number) => Number.isFinite(value) && value > 0

// 12 significant digits: enough that amount × quantity × rate gives back
// the total typed, without float noise.
const precise = (value: number) => String(Number(value.toPrecision(12)))

// For an entry in another currency: its total in the book's currency, which
// can also be typed. Amount, rate and total are linked; whichever of them
// was touched longest ago is worked out from the other two. Only amount and
// rate are saved: the total is always amount × quantity × rate.
export const ConvertedTotal = (
  properties: Pick<TEntryFormProperties, 'book' | 'currencies'>,
) => {
  const { book, currencies } = properties
  const { control, getValues, setValue, watch } =
    useFormContext<TFinanceEntryForm>()
  const [currency, amount, quantity, rate] = useWatch({
    control,
    name: ['currency', 'amount', 'quantity', 'rate'],
  })
  const { t } = useTranslation()
  const money = useMoney()
  // The total lives in a form of its own: it is not part of the entry.
  const totalForm = useForm<{ total: string }>({
    defaultValues: { total: '' },
  })
  const order = useRef<TLinked[]>(initialOrder)
  const isForeign = currency.code !== book.code

  const touch = (field: TLinked) => {
    order.current = [...order.current.filter((item) => item !== field), field]
  }

  // Work out the least recently touched of the three from the others.
  const recompute = () => {
    const units = Number(getValues('quantity'))
    const unitAmount = Number(getValues('amount'))
    const exchangeRate = Number(getValues('rate'))
    const total = Number(totalForm.getValues('total'))
    const target = order.current[0]
    if (target === 'total') {
      const next =
        isPositive(unitAmount) && isPositive(units) && isPositive(exchangeRate)
          ? String(
              Number(
                (unitAmount * units * exchangeRate).toFixed(
                  book.maximumFractionDigits,
                ),
              ),
            )
          : ''
      if (next !== totalForm.getValues('total'))
        totalForm.setValue('total', next)
      return
    }
    if (!isPositive(total) || !isPositive(units)) return
    if (target === 'amount' && isPositive(exchangeRate)) {
      const next = precise(total / (units * exchangeRate))
      if (next !== String(getValues('amount')))
        setValue('amount', next as unknown as number, {
          shouldDirty: true,
          shouldValidate: true,
        })
    }
    if (target === 'rate' && isPositive(unitAmount)) {
      const next = precise(total / (unitAmount * units))
      if (next !== String(getValues('rate')))
        setValue('rate', next as unknown as number, {
          shouldDirty: true,
          shouldValidate: true,
        })
    }
  }

  // What the person types in amount or rate; a reset (after saving, or
  // another entry) starts over.
  useEffect(() => {
    const subscription = watch((_, { name, type }) => {
      if (name === undefined) {
        // Worked out from the new values, so it is right however often a
        // reset is reported.
        order.current = initialOrder
        recompute()
        return
      }
      if (type === 'change' && (name === 'amount' || name === 'rate'))
        touch(name)
    })
    return () => subscription.unsubscribe()
    // recompute reads the latest values through getValues.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, totalForm])

  useEffect(() => {
    const subscription = totalForm.watch((_, { type }) => {
      if (type !== 'change') return
      touch('total')
      recompute()
    })
    return () => subscription.unsubscribe()
    // recompute reads the latest values through getValues.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalForm])

  // Any change to the inputs (typed, or a suggested rate) updates the one
  // being worked out.
  useEffect(() => {
    if (isForeign) recompute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, quantity, rate, isForeign])

  const defaultCurrency = currencies.find((option) => option.isDefault)
  const bookRate = currencies.find((option) => option.code === book.code)?.rate
  const bookTotal =
    Number(amount) * Number(quantity) * (isForeign ? Number(rate) : 1)
  // The entered rate converts into the book. Use the person's settings only
  // for the extra preview when their default currency differs from the book.
  const defaultTotal =
    defaultCurrency &&
    defaultCurrency.code !== book.code &&
    defaultCurrency.code !== currency.code &&
    bookRate &&
    bookRate > 0 &&
    defaultCurrency.rate > 0 &&
    isPositive(bookTotal)
      ? (bookTotal * bookRate) / defaultCurrency.rate
      : undefined
  const showDefault =
    defaultTotal !== undefined && Number.isFinite(defaultTotal)

  if (!isForeign && !showDefault) return null

  return (
    <div className="motion-fade grid gap-1.5">
      {isForeign && (
        <FormProvider {...totalForm}>
          <NumberInput
            name="total"
            label={t('finances.form.convertedTotal.book', { code: book.code })}
            hint={t('finances.form.convertedTotal.hint')}
            allowMath
            fractionDigits={book.maximumFractionDigits}
          />
        </FormProvider>
      )}
      {showDefault && defaultCurrency && (
        <p
          role="status"
          aria-atomic="true"
          className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-lg border bg-muted/40 px-2 py-1.5 text-xs"
        >
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
