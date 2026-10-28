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
import { categoryKeywords } from '~/lib/constants/category-keywords'
import { financeCategories } from '~/lib/constants/finance'
import { useUserData } from '~/lib/hooks/use-get-user'
import {
  TFinanceCurrency,
  TFinanceEntry,
  TFinanceEntryForm,
} from '~/lib/types/finance'
import { TCurrency } from '~/lib/types/settings'
import { suggestCategory } from '~/lib/utils/category-classifier'
import { clearDraft, readDraft, writeDraft } from '~/lib/utils/drafts'
import {
  lastCategory,
  newEntryId,
  suggestRate,
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

export const EntryForm = (properties: TEntryFormProperties) => {
  const {
    onClose,
    entry,
    date,
    book,
    currencies,
    history,
    onSave,
    onDelete,
    draftKey,
    isPrivate = false,
  } = properties
  const { t } = useTranslation(['common', 'zod'])
  const { data: userData } = useUserData()
  const isEditing = !!entry
  const panelReference = useRef<HTMLElement>(null)
  const [editingFields, setEditingFields] = useState({
    currency: false,
    rate: false,
  })

  const empty: TFinanceEntryForm = {
    id: newEntryId(),
    date: date ?? today(),
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
    // A new entry starts with the category last used for expenses, or with
    // what was typed and not saved last time.
    const draft =
      !entry && draftKey
        ? readDraft<Partial<TFinanceEntryForm>>(draftKey)
        : undefined
    reset(
      entry ?? {
        ...empty,
        category: lastCategory('expense', pastEntries) ?? '',
        ...draft,
        id: newEntryId(),
      },
    )
    if (draft?.category) isCategoryChosen.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry])

  // A new entry being typed is kept as a draft once it has a description
  // or an amount; saving or cancelling clears it, closing the page doesn't.
  useEffect(() => {
    if (isEditing || !draftKey) return
    const subscription = watch((values) => {
      const hasContent =
        String(values.description ?? '').trim() !== '' ||
        String(values.amount ?? '').trim() !== ''
      if (hasContent) writeDraft(draftKey, values, isPrivate)
      else clearDraft(draftKey)
    })
    return () => subscription.unsubscribe()
  }, [watch, isEditing, draftKey, isPrivate])

  const handleCancel = () => {
    if (!isEditing && draftKey) clearDraft(draftKey)
    onClose()
  }

  const type = watch('type')
  const currency = watch('currency')
  const category = watch('category')
  const rate = watch('rate')
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
    const text = getValues('description')
    const options = {
      description: text,
      history: pastEntries,
      keywords: categoryKeywords,
      categories: financeCategories,
    }
    const found = suggestCategory(options)
    if (!found) return
    // Only a sure guess switches income and expense (a word like "sewa" can
    // be either); otherwise the best category of the current type.
    const match =
      found.confidence >= 0.9 || found.type === getValues('type')
        ? found
        : suggestCategory({ ...options, type: getValues('type') })
    if (!match) return
    if (!isTypeChosen.current && match.type !== getValues('type')) {
      setValue('type', match.type, { shouldDirty: true })
    }
    if (
      match.type !== getValues('type') ||
      match.category === getValues('category')
    )
      return
    setValue('category', match.category, {
      shouldDirty: true,
      shouldValidate: true,
    })
    setIsSuggested(true)
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
    if (currentType === next) return
    const remembered =
      categoryByType.current[next] ?? lastCategory(next, pastEntries) ?? ''
    setValue('category', remembered, {
      shouldDirty: true,
      shouldValidate: remembered !== '',
    })
  }

  // Start at the description when the form opens and after each saved
  // entry, so a batch can be typed without reaching for the pointer. Only
  // opening scrolls to the form: after a save the book scrolls to the new
  // entry instead.
  useEffect(() => {
    if (focusRequest === 0) return
    if (savedCount === 0)
      panelReference.current?.scrollIntoView({ block: 'start' })
    setFocus('description')
  }, [focusRequest, savedCount, setFocus])

  // The edit form opens where its entry was, which may be under the floating
  // totals and Add button; bring it fully into view below them.
  useEffect(() => {
    if (isEditing) panelReference.current?.scrollIntoView({ block: 'nearest' })
  }, [isEditing])

  useEffect(() => {
    if (editingFields.rate) setFocus('rate')
  }, [editingFields.rate, setFocus])

  const onSubmit = handleSubmit(
    (data) => {
      onSave(data)
      if (draftKey && !isEditing) clearDraft(draftKey)
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
      setEditingFields({ currency: false, rate: false })
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
      // Only the add form floats; the edit form sits in the list.
      data-entry-dock={isEditing ? undefined : true}
      aria-labelledby="finance-entry-title"
      className={cn(
        'motion-enter [&_[role=combobox]]:h-8 [&_button[aria-haspopup=dialog]]:h-8 [&_input]:h-8 [&_label]:block [&_label]:text-xs [&_label]:leading-tight',
        isEditing
          ? // Clears the floating totals and Add button (h-9) above, and the bottom
            // menu on phones, with a gap.
            'scroll-mt-[calc(7.5rem+var(--summary-height,0px)+3.25rem)] scroll-mb-[calc(5.5rem+var(--nav-bottom,0px))] p-3 sm:p-4 md:scroll-mt-[calc(8.5rem+var(--summary-height,0px)+3.25rem)] md:scroll-mb-4'
          : // Adding floats under the book's totals, compact and see-through,
            // so the entries scrolling under it can be checked while typing.
            'glass-surface glass-float sticky top-[calc(7.5rem+var(--summary-height,0px)+0.5rem)] z-20 max-h-[calc(100dvh-14.5rem-var(--summary-height,0px))] scroll-mt-[calc(7.5rem+var(--summary-height,0px)+0.5rem)] overflow-y-auto rounded-xl border p-2.5 shadow-lg sm:p-3 md:top-[calc(8.5rem+var(--summary-height,0px)+0.5rem)] md:max-h-[calc(100dvh-10.5rem-var(--summary-height,0px))] md:scroll-mt-[calc(8.5rem+var(--summary-height,0px)+0.5rem)] [&_[role=combobox]]:bg-background [&_input]:bg-background',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          isEditing ? 'mb-2' : 'mb-1.5',
        )}
      >
        <h2
          id="finance-entry-title"
          className="text-base font-semibold"
        >
          {t(isEditing ? 'finances.entry.edit' : 'finances.entry.add')}
        </h2>
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'truncate text-xs font-medium',
              type === 'income' ? 'text-income' : 'text-expense',
            )}
          >
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
                type === 'income' ? 'text-muted-foreground' : 'text-expense',
              )}
            />
            <BanknoteArrowDown
              aria-hidden="true"
              className={cn(
                'relative size-5 justify-self-center',
                type === 'expense' ? 'text-muted-foreground' : 'text-income',
              )}
            />
          </button>
        </div>
      </div>
      <FormProvider {...formMethods}>
        <form
          onSubmit={onSubmit}
          className={cn('grid', isEditing ? 'gap-2.5' : 'gap-2')}
        >
          {savedCount > 0 && (
            <p
              role="status"
              className="motion-fade text-xs text-muted-foreground"
            >
              {t('finances.entry.ready')}
            </p>
          )}
          <DatePicker
            name="date"
            label={t('finances.form.date.label')}
            required
          />

          {/* Top-aligned: the category's "chosen from earlier entries" note
              must not push the description down. */}
          <div
            className={cn(
              'grid items-start gap-2',
              isEditing
                ? 'sm:grid-cols-2'
                : 'grid-cols-[repeat(2,minmax(0,1fr))]',
            )}
          >
            <Input
              name="description"
              label={t('finances.form.description.label')}
              placeholder={t('finances.form.description.placeholder')}
            />

            <div className="grid grid-cols-1 gap-1">
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

          {/* Keep quantity after amount, with all inputs level even when
              the amount shows a calculation result underneath. */}
          <div className="grid grid-cols-[minmax(0,1fr)_5rem_auto] items-start gap-x-2 gap-y-1">
            <Label
              htmlFor="finance-entry-amount"
              className="col-span-3"
            >
              {t('finances.form.amount.label')}{' '}
              <sup className="text-destructive">*</sup>
            </Label>
            <NumberInput
              name="amount"
              id="finance-entry-amount"
              allowMath
              calculatorKeyboard
              fractionDigits={currency.maximumFractionDigits}
            />
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
                onClick={handleCancel}
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
