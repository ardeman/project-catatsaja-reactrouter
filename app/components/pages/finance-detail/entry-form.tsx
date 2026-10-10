import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { DatePicker } from '~/components/base/date-picker'
import { Input } from '~/components/base/input'
import { Modal } from '~/components/base/modal'
import { NumberInput } from '~/components/base/number-input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/base/select'
import { Label } from '~/components/ui/label'
import { financeCategories } from '~/lib/constants/finance'
import {
  TFinanceCurrency,
  TFinanceEntry,
  TFinanceEntryForm,
} from '~/lib/types/finance'
import { TCurrency } from '~/lib/types/settings'
import {
  lastCategory,
  newEntryId,
  suggestFromHistory,
  today,
} from '~/lib/utils/finance'
import { cn } from '~/lib/utils/shadcn'
import { entrySchema } from '~/lib/validations/finance'

import { AddCurrency } from './add-currency'
import { TEntryFormProperties } from './type'

// The currency list item that opens "Add currency".
const ADD_CURRENCY = '__add-currency'

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
  const { open, setOpen, entry, book, currencies, history, onSave, onDelete } =
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
  const categoryByType = useRef<Partial<Record<TFinanceEntry['type'], string>>>(
    {},
  )

  // Choices the person made themselves; suggestions never override them.
  const isCategoryChosen = useRef(false)
  const isTypeChosen = useRef(false)
  const [isSuggested, setIsSuggested] = useState(false)
  const [isAddingCurrency, setIsAddingCurrency] = useState(false)
  // Past entries (all books, newest first), without the one being edited.
  const pastEntries = history.filter((item) => item.id !== entry?.id)

  useEffect(() => {
    if (!open) return
    categoryByType.current = {}
    isCategoryChosen.current = false
    isTypeChosen.current = false
    setIsSuggested(false)
    // A new entry starts with the category last used for expenses.
    reset(
      entry ?? {
        ...empty,
        id: newEntryId(),
        category: lastCategory('expense', pastEntries) ?? '',
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry])

  const type = watch('type')
  const currency = watch('currency')
  const category = watch('category')
  const description = watch('description')
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
    if (code === ADD_CURRENCY) {
      setIsAddingCurrency(true)
      return
    }
    const next = currencyOptions.find((option) => option.code === code)
    if (!next) return
    setValue('currency', next, { shouldDirty: true })
    setValue('rate', suggestRate(code, book, currencies), { shouldDirty: true })
  }

  // A new currency from the entry form: select it, with the rate from its
  // value in the default currency.
  const handleCurrencyAdded = (added: TCurrency) => {
    const next = toFinanceCurrency(added)
    setValue('currency', next, { shouldDirty: true })
    setValue('rate', suggestRate(next.code, book, [...currencies, added]), {
      shouldDirty: true,
    })
  }

  // Typing a description picks the category (and type) used before for the
  // same words, unless the person already chose one.
  useEffect(() => {
    if (!open || isEditing || isCategoryChosen.current) return
    // The form's current text: right after opening, `description` from this
    // render still holds the previous entry's.
    const match = suggestFromHistory(getValues('description'), pastEntries)
    if (!match) return
    if (!isTypeChosen.current && match.type !== getValues('type')) {
      setValue('type', match.type, { shouldDirty: true })
    }
    if (
      match.type === getValues('type') &&
      match.category !== getValues('category')
    ) {
      setValue('category', match.category, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setIsSuggested(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, open])

  const handleTypeChange = (next: TFinanceEntry['type']) => {
    isTypeChosen.current = true
    // A category belongs to one type. Switching type swaps in the category
    // last chosen for that type (or none), so switching back restores it.
    const current = getValues('category')
    const currentType = financeCategories.find(
      ({ key }) => key === current,
    )?.type
    if (currentType) categoryByType.current[currentType] = current
    setValue('type', next, { shouldDirty: true })
    if (currentType !== next) {
      const remembered =
        categoryByType.current[next] ?? lastCategory(next, pastEntries) ?? ''
      setValue('category', remembered, {
        shouldDirty: true,
        shouldValidate: remembered !== '',
      })
    }
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
            <NumberInput
              name="amount"
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
                  <SelectItem value={ADD_CURRENCY}>
                    <span className="flex items-center gap-2">
                      <Plus className="size-4" />
                      {t('finances.addCurrency.option')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              name="quantity"
              label={t('finances.form.quantity.label')}
            />
            <DatePicker
              name="date"
              label={t('finances.form.date.label')}
              required
            />
          </div>

          {isForeign && (
            <NumberInput
              name="rate"
              label={t('finances.form.rate.label', {
                from: currency.code,
                to: book.code,
              })}
              hint={t('finances.form.rate.hint')}
              required
            />
          )}

          <Input
            name="description"
            label={t('finances.form.description.label')}
            placeholder={t('finances.form.description.placeholder')}
          />

          <div className="grid gap-2">
            <Label>
              {t('finances.form.category.label')}{' '}
              <sup className="text-destructive">*</sup>
            </Label>
            <Select
              // Always controlled: "" shows the placeholder. Leaving it undefined
              // lets the picker keep showing an old choice the form cleared.
              value={category}
              onValueChange={(next) => {
                // Radix reports "" when the option list changes under it; a person
                // can't choose "nothing", so ignore it.
                if (!next) return
                isCategoryChosen.current = true
                setIsSuggested(false)
                setValue('category', next, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }}
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
            {isSuggested && (
              <p className="text-[0.8rem] text-muted-foreground">
                {t('finances.form.category.suggested')}
              </p>
            )}
            {formMethods.formState.errors.category && (
              <p className="text-[0.8rem] font-medium text-destructive">
                {formMethods.formState.errors.category.message}
              </p>
            )}
          </div>

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
      <AddCurrency
        open={isAddingCurrency}
        setOpen={setIsAddingCurrency}
        currencies={currencies}
        onAdded={handleCurrencyAdded}
      />
    </Modal>
  )
}
