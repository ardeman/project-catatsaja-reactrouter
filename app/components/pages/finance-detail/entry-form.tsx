import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { Input } from '~/components/base/input'
import { Modal } from '~/components/base/modal'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { financeCategories } from '~/lib/constants/finance'
import {
  TFinanceCurrency,
  TFinanceEntry,
  TFinanceEntryForm,
} from '~/lib/types/finance'
import { TCurrency } from '~/lib/types/settings'
import { newEntryId, today } from '~/lib/utils/finance'
import { cn } from '~/lib/utils/shadcn'
import { entrySchema } from '~/lib/validations/finance'

import { TEntryFormProperties } from './type'

const toFinanceCurrency = (
  currency: Pick<TCurrency, 'code' | 'symbol' | 'maximumFractionDigits'>,
): TFinanceCurrency => ({
  code: currency.code,
  symbol: currency.symbol,
  maximumFractionDigits: currency.maximumFractionDigits,
})

// Book-currency units for 1 unit of \`code\`, from the person's own rates
// (each rate is the value of 1 unit in their default currency). 1 when the
// currencies match or a rate is missing; it can be edited either way.
const suggestRate = (
  code: string,
  book: TFinanceCurrency,
  currencies: TCurrency[],
) => {
  if (code === book.code) return 1
  const from = currencies.find((currency) => currency.code === code)
  const to = currencies.find((currency) => currency.code === book.code)
  if (!from?.rate || !to?.rate) return 1
  return Number((from.rate / to.rate).toPrecision(8))
}

export const EntryForm = (properties: TEntryFormProperties) => {
  const { open, setOpen, entry, book, currencies, onSave, onDelete } =
    properties
  const { t } = useTranslation(['common', 'zod'])
  const isEditing = !!entry

  const empty: TFinanceEntryForm = {
    id: newEntryId(),
    date: today(),
    type: 'expense',
    category: '',
    description: '',
    quantity: 1,
    amount: '' as unknown as number,
    currency: book,
    rate: 1,
  }
  const formMethods = useForm<TFinanceEntryForm, unknown, TFinanceEntry>({
    resolver: zodResolver(entrySchema(t)),
    defaultValues: empty,
  })
  const { handleSubmit, watch, setValue, reset, getValues } = formMethods

  // Fresh values each time the form opens.
  useEffect(() => {
    if (open) reset(entry ?? { ...empty, id: newEntryId() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry])

  const type = watch('type')
  const currency = watch('currency')
  const category = watch('category')
  const isForeign = currency.code !== book.code

  // Every currency the person can pick: their own, the book's, and the
  // entry's (it may come from someone the book is shared with).
  const currencyOptions = [
    ...currencies.map((option) => toFinanceCurrency(option)),
    book,
    ...(entry ? [entry.currency] : []),
  ].filter(
    (option, index, all) =>
      all.findIndex((other) => other.code === option.code) === index,
  )

  const handleCurrencyChange = (code: string) => {
    const next = currencyOptions.find((option) => option.code === code)
    if (!next) return
    setValue('currency', next, { shouldDirty: true })
    setValue('rate', suggestRate(code, book, currencies), { shouldDirty: true })
  }

  const handleTypeChange = (next: TFinanceEntry['type']) => {
    setValue('type', next, { shouldDirty: true })
    // A category belongs to one type; clear it when it no longer fits.
    const current = financeCategories.find(
      ({ key }) => key === getValues('category'),
    )
    if (current && current.type !== next) setValue('category', '')
  }

  const onSubmit = handleSubmit((data) => {
    onSave(data)
    setOpen(false)
  })

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      title={t(isEditing ? 'finances.entry.edit' : 'finances.entry.add')}
    >
      <FormProvider {...formMethods}>
        <form
          onSubmit={onSubmit}
          className="grid gap-4"
        >
          <div
            role="radiogroup"
            aria-label={t('finances.form.type.label')}
            className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1"
          >
            {(['expense', 'income'] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={type === option}
                onClick={() => handleTypeChange(option)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors',
                  type === option && 'bg-background text-foreground shadow-sm',
                )}
              >
                {t(`finances.form.type.${option}`)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <Input
              name="amount"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              label={t('finances.form.amount.label')}
              required
              autoFocus={!isEditing} // eslint-disable-line jsx-a11y/no-autofocus
            />
            <div className="grid gap-1">
              <Label className="sr-only">
                {t('finances.form.currency.label')}
              </Label>
              <Select
                value={currency.code}
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger
                  aria-label={t('finances.form.currency.label')}
                  className="w-28"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem
                      key={option.code}
                      value={option.code}
                    >
                      {option.code} ({option.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              name="quantity"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              label={t('finances.form.quantity.label')}
            />
            <Input
              name="date"
              type="date"
              label={t('finances.form.date.label')}
              required
            />
          </div>

          {isForeign && (
            <Input
              name="rate"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              label={t('finances.form.rate.label', {
                from: currency.code,
                to: book.code,
              })}
              hint={t('finances.form.rate.hint')}
              required
            />
          )}

          <div className="grid gap-2">
            <Label>
              {t('finances.form.category.label')}{' '}
              <sup className="text-destructive">*</sup>
            </Label>
            <Select
              value={category || undefined}
              onValueChange={(next) =>
                setValue('category', next, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger aria-label={t('finances.form.category.label')}>
                <SelectValue
                  placeholder={t('finances.form.category.placeholder')}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {financeCategories
                    .filter((option) => option.type === type)
                    .map(({ key, icon: Icon }) => (
                      <SelectItem
                        key={key}
                        value={key}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="size-4 text-muted-foreground" />
                          {t(`finances.form.category.${key}.label`)}
                        </span>
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {formMethods.formState.errors.category && (
              <p className="text-[0.8rem] font-medium text-destructive">
                {formMethods.formState.errors.category.message}
              </p>
            )}
          </div>

          <Input
            name="description"
            label={t('finances.form.description.label')}
            placeholder={t('finances.form.description.placeholder')}
          />

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {isEditing && (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onDelete(entry.id)
                  setOpen(false)
                }}
              >
                {t('finances.entry.delete')}
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              {/* Phones get the sheet's own Close button. */}
              <div className="hidden sm:block">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  {t('form.cancel')}
                </Button>
              </div>
              <Button type="submit">{t('actions.save')}</Button>
            </div>
          </div>
        </form>
      </FormProvider>
    </Modal>
  )
}
