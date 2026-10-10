import { zodResolver } from '@hookform/resolvers/zod'
import { BanknoteArrowDown, BanknoteArrowUp, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { CategoryIcon } from '~/components/base/category-icon'
import { DatePicker } from '~/components/base/date-picker'
import { Input } from '~/components/base/input'
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
import { useUserData } from '~/lib/hooks/use-get-user'
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
import {
  formatExchangeRate,
  getDefaultCurrencyFormat,
} from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'
import { entrySchema } from '~/lib/validations/finance'

import { AddCurrency } from './add-currency'
import { ConvertedTotal } from './converted-total'
import { EditableValue } from './editable-value'
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
  const { onClose, entry, book, currencies, history, onSave, onDelete } =
    properties
  const { t, i18n } = useTranslation(['common', 'zod'])
  const { data: userData } = useUserData()
  const isEditing = !!entry
  const panelReference = useRef<HTMLElement>(null)
  const [editingFields, setEditingFields] = useState({
    date: false,
    currency: false,
    rate: false,
  })

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
  const { handleSubmit, watch, setValue, reset, getValues, setFocus } =
    formMethods

  // Fresh values when starting or switching the entry being edited.
  const categoryByType = useRef<Partial<Record<TFinanceEntry['type'], string>>>(
    {},
  )

  // Choices the person made themselves; suggestions never override them.
  const isCategoryChosen = useRef(false)
  const isTypeChosen = useRef(false)
  const [isSuggested, setIsSuggested] = useState(false)
  const [isAddingCurrency, setIsAddingCurrency] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  // Bumped after each reset: reset() drops the inputs' references until the
  // next render, so focusing has to wait for that render.
  const [focusRequest, setFocusRequest] = useState(0)
  // Past entries (all books, newest first), without the one being edited.
  const pastEntries = history.filter((item) => item.id !== entry?.id)

  useEffect(() => {
    setSavedCount(0)
    setFocusRequest((count) => count + 1)
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
  }, [entry])

  const type = watch('type')
  const currency = watch('currency')
  const category = watch('category')
  const rate = watch('rate')
  const date = watch('date')
  const dateLabel = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
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
    setEditingFields((fields) => ({ ...fields, rate: false }))
    setValue('currency', next, { shouldDirty: true })
    setValue('rate', suggestRate(code, book, currencies), { shouldDirty: true })
  }

  // A new currency from the entry form: select it, with the rate from its
  // value in the default currency.
  const handleCurrencyAdded = (added: TCurrency) => {
    const next = toFinanceCurrency(added)
    setEditingFields((fields) => ({ ...fields, rate: false }))
    setValue('currency', next, { shouldDirty: true })
    setValue('rate', suggestRate(next.code, book, [...currencies, added]), {
      shouldDirty: true,
    })
  }

  // Typing a description picks the category (and type) used before for the
  // same words, unless the person already chose one.
  useEffect(() => {
    if (isEditing || isCategoryChosen.current) return
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
  }, [description])

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

  // Start at the description when the form opens and after each saved
  // entry, so a batch can be typed without reaching for the pointer.
  useEffect(() => {
    if (focusRequest === 0) return
    panelReference.current?.scrollIntoView({ block: 'start' })
    setFocus('description')
  }, [focusRequest, setFocus])

  useEffect(() => {
    if (editingFields.rate) setFocus('rate')
  }, [editingFields.rate, setFocus])

  const onSubmit = handleSubmit(
    (data) => {
      onSave(data)
      if (isEditing) {
        onClose()
        return
      }
      // Keep the date, currency, rate, type and category for quick batch entry.
      reset({
        ...data,
        id: newEntryId(),
        amount: '',
        quantity: 1,
        description: '',
      })
      setIsSuggested(false)
      setEditingFields({ date: false, currency: false, rate: false })
      setSavedCount((count) => count + 1)
      setFocusRequest((count) => count + 1)
    },
    (errors) => {
      if (errors.rate) setEditingFields((fields) => ({ ...fields, rate: true }))
    },
  )

  return (
    <section
      ref={panelReference}
      aria-labelledby="finance-entry-title"
      className={cn(
        'motion-enter scroll-mt-36 p-3 sm:p-4 [&_[role=combobox]]:h-8 [&_input]:h-8 [&_label]:text-xs [&_label]:leading-tight',
        !isEditing && 'glass-surface rounded-xl border',
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2
          id="finance-entry-title"
          className="text-base font-semibold"
        >
          {t(isEditing ? 'finances.entry.edit' : 'finances.entry.add')}
        </h2>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs text-muted-foreground">
            {t(`finances.form.type.${type}`)}
          </span>
          <button
            type="button"
            role="switch"
            aria-label={t('finances.form.type.income')}
            aria-checked={type === 'income'}
            title={t(`finances.form.type.${type}`)}
            onClick={() =>
              handleTypeChange(type === 'expense' ? 'income' : 'expense')
            }
            className="relative grid h-9 w-20 shrink-0 grid-cols-2 items-center rounded-lg border bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute top-1 left-1 h-7 w-8 rounded-md bg-background shadow-sm transition-transform motion-reduce:transition-none',
                type === 'income' && 'translate-x-10',
              )}
            />
            <BanknoteArrowUp
              aria-hidden="true"
              className={cn(
                'relative size-5 justify-self-center',
                type === 'income' && 'text-muted-foreground',
              )}
            />
            <BanknoteArrowDown
              aria-hidden="true"
              className={cn(
                'relative size-5 justify-self-center',
                type === 'expense' && 'text-muted-foreground',
              )}
            />
          </button>
        </div>
      </div>
      <FormProvider {...formMethods}>
        <form
          onSubmit={onSubmit}
          className="grid gap-2.5"
        >
          {savedCount > 0 && (
            <p
              role="status"
              className="motion-fade text-xs text-muted-foreground"
            >
              {t('finances.entry.ready')}
            </p>
          )}
          <div className="grid grid-cols-[minmax(0,1fr)_5rem] items-end gap-2">
            <EditableValue
              label={t('finances.form.date.label')}
              value={dateLabel}
              required
              isEditing={editingFields.date}
              onEdit={() =>
                setEditingFields((fields) => ({ ...fields, date: true }))
              }
            >
              <DatePicker
                name="date"
                label={t('finances.form.date.label')}
                required
                defaultOpen
              />
            </EditableValue>
            <div className="flex items-center gap-1.5">
              <Label
                htmlFor="finance-entry-quantity"
                title={t('finances.form.quantity.label')}
              >
                {t('finances.form.quantity.shortLabel')}
              </Label>
              <NumberInput
                name="quantity"
                id="finance-entry-quantity"
                accessibleLabel={t('finances.form.quantity.label')}
                className="min-w-0 flex-1"
              />
            </div>
          </div>

          <div className="grid items-end gap-2.5 sm:grid-cols-2">
            <Input
              name="description"
              label={t('finances.form.description.label')}
              placeholder={t('finances.form.description.placeholder')}
            />

            <div className="grid gap-1">
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
                      .map(({ key }) => (
                        <SelectItem
                          key={key}
                          value={key}
                        >
                          <span className="flex items-center gap-2">
                            <CategoryIcon category={key} />
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
          </div>

          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <NumberInput
              name="amount"
              allowMath
              calculatorKeyboard
              fractionDigits={currency.maximumFractionDigits}
              label={t('finances.form.amount.label')}
              required
            />
            <EditableValue
              label={t('finances.form.currency.label')}
              value={`${currency.code} (${currency.symbol})`}
              isEditing={editingFields.currency}
              onEdit={() =>
                setEditingFields((fields) => ({ ...fields, currency: true }))
              }
            >
              <div className="grid gap-1">
                <Label className="sr-only">
                  {t('finances.form.currency.label')}
                </Label>
                <Select
                  defaultOpen
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
            </EditableValue>
          </div>

          {isForeign && (
            <EditableValue
              label={t('finances.form.rate.label', {
                from: currency.code,
                to: book.code,
              })}
              value={formatExchangeRate(
                Number(rate),
                userData?.currencyFormat ?? getDefaultCurrencyFormat(),
              )}
              required
              isEditing={editingFields.rate}
              onEdit={() =>
                setEditingFields((fields) => ({ ...fields, rate: true }))
              }
            >
              <NumberInput
                name="rate"
                allowMath
                label={t('finances.form.rate.label', {
                  from: currency.code,
                  to: book.code,
                })}
                hint={t('finances.form.rate.hint')}
                required
              />
            </EditableValue>
          )}

          <ConvertedTotal
            book={book}
            currencies={currencies}
          />

          <div className="flex flex-wrap items-center gap-2">
            {isEditing && (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onDelete(entry.id)
                  onClose()
                }}
              >
                {t('finances.entry.delete')}
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
              >
                {t('form.cancel')}
              </Button>
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
    </section>
  )
}
