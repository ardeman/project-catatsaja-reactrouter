import { Keyboard } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { AiNotice } from '~/components/base/ai-notice'
import { Button } from '~/components/base/button'
import { CategoryIcon } from '~/components/base/category-icon'
import { Textarea } from '~/components/base/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import { categoryKeywords } from '~/lib/constants/category-keywords'
import { financeCategories } from '~/lib/constants/finance'
import { useAiConsent } from '~/lib/hooks/use-ai-consent'
import { useMoney } from '~/lib/hooks/use-money'
import { useReadTypedEntries } from '~/lib/hooks/use-read-typed-entries'
import { TTypedEntries } from '~/lib/types/finance'
import { suggestCategory } from '~/lib/utils/category-classifier'
import {
  lastCategory,
  matchCurrency,
  newEntryId,
  suggestRate,
  summarize,
  today,
} from '~/lib/utils/finance'
import { typedToEntries } from '~/lib/utils/receipt'
import { cn } from '~/lib/utils/shadcn'

import { TReceiptScanProperties } from './type'

// Entries from a line of text ("makan siang 45rb kemarin, gaji 5jt"), read
// by Gemini and checked before they are added. The text goes to Google only
// when the person presses Read, after agreeing once to `AiNotice`.
export const QuickAdd = (properties: TReceiptScanProperties) => {
  const { book, currencies, history, onAdd } = properties
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const { run, notice } = useAiConsent()
  const { mutate: read, isPending } = useReadTypedEntries()
  const [isOpen, setIsOpen] = useState(false)
  const [typed, setTyped] = useState<TTypedEntries>()
  // Entries left out, by their place in the list.
  const [skipped, setSkipped] = useState<Set<number>>(new Set())
  const textForm = useForm<{ text: string }>({ defaultValues: { text: '' } })
  const text = textForm.watch('text')

  const { currency, isCurrencyUnknown } = useMemo(
    () => matchCurrency(typed?.currency, book, currencies),
    [typed, book, currencies],
  )
  const rows = useMemo(() => {
    if (!typed) return []
    return typedToEntries({
      typed,
      today: today(),
      currency,
      rate: suggestRate(currency.code, book, currencies),
      categoryFor: (description, type) =>
        suggestCategory({
          description,
          history,
          keywords: categoryKeywords,
          categories: financeCategories,
          type,
        })?.category,
      fallbackCategory: (type) =>
        lastCategory(type, history) ??
        (type === 'income' ? 'otherIncome' : 'otherExpenses'),
      newId: newEntryId,
    })
  }, [typed, currency, book, currencies, history])
  const chosen = rows
    .filter((_, index) => !skipped.has(index))
    .map(({ entry }) => entry)
  const { income, expense } = summarize(chosen)

  const formatDay = (day: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(`${day}T00:00:00Z`))

  const close = () => {
    setIsOpen(false)
    setTyped(undefined)
    textForm.reset({ text: '' })
  }

  const handleRead = () =>
    run(async () => {
      const now = new Date()
      const result = await read({
        text: text.trim(),
        today: today(),
        weekday: new Intl.DateTimeFormat('en', { weekday: 'long' }).format(now),
      })
      if (!result) return
      setSkipped(new Set())
      setTyped(result)
    })

  const toggle = (index: number) =>
    setSkipped((current) => {
      const next = new Set(current)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })

  const handleAdd = () => {
    onAdd(chosen)
    close()
  }

  return (
    <>
      {isOpen ? (
        <section
          aria-labelledby="quick-add-title"
          className="motion-enter glass-surface order-last grid basis-full gap-3 rounded-xl border p-3 sm:p-4"
        >
          <h2
            id="quick-add-title"
            className="text-base font-semibold"
          >
            {t('finances.quickAdd.title')}
          </h2>
          {typed ? (
            <>
              <ul className="grid divide-y rounded-lg border">
                {rows.map(({ entry, dateIssue }, index) => {
                  const isSkipped = skipped.has(index)
                  const isIncome = entry.type === 'income'
                  const details = [
                    formatDay(entry.date),
                    entry.quantity === 1
                      ? ''
                      : `${entry.quantity} × ${money(entry.amount, currency)}`,
                    dateIssue ? t('finances.quickAdd.checkDate') : '',
                  ].filter(Boolean)
                  return (
                    <li key={entry.id}>
                      <label
                        className={cn(
                          'grid cursor-pointer grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 hover:bg-muted/50',
                          isSkipped && 'opacity-50',
                        )}
                      >
                        <Checkbox
                          checked={!isSkipped}
                          onCheckedChange={() => toggle(index)}
                        />
                        <CategoryIcon
                          category={entry.category}
                          chip
                        />
                        <span className="grid min-w-0">
                          <span className="truncate text-sm font-medium">
                            {entry.description ||
                              t(
                                `finances.form.category.${entry.category}.label`,
                              )}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {details.join(' · ')}
                          </span>
                        </span>
                        <span
                          className={cn(
                            'text-sm font-medium tabular-nums',
                            isIncome ? 'text-income' : 'text-expense',
                          )}
                        >
                          {money(
                            (isIncome ? 1 : -1) * entry.quantity * entry.amount,
                            currency,
                            true,
                          )}
                        </span>
                      </label>
                    </li>
                  )
                })}
                <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-muted/40 px-3 py-2 text-sm font-semibold">
                  <span>
                    {t('finances.receipt.chosenTotal', {
                      count: chosen.length,
                    })}
                  </span>
                  <span className="flex gap-3 tabular-nums">
                    {income > 0 && (
                      <span className="text-income">
                        {money(income, currency)}
                      </span>
                    )}
                    {expense > 0 && (
                      <span className="text-expense">
                        {money(-expense, currency, true)}
                      </span>
                    )}
                  </span>
                </li>
              </ul>
              {isCurrencyUnknown && (
                <p className="text-xs text-muted-foreground">
                  {t('finances.receipt.currencyUnknown', {
                    code: typed.currency.toUpperCase(),
                    book: book.code,
                  })}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t('finances.quickAdd.check')}
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setTyped(undefined)}
                >
                  {t('finances.quickAdd.edit')}
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={chosen.length === 0}
                >
                  {t('finances.receipt.add', { count: chosen.length })}
                </Button>
              </div>
            </>
          ) : (
            <FormProvider {...textForm}>
              <Textarea
                name="text"
                label={t('finances.quickAdd.label')}
                placeholder={t('finances.quickAdd.placeholder')}
                hint={t('finances.quickAdd.hint')}
                rows={3}
                autoFocus // eslint-disable-line jsx-a11y/no-autofocus -- opened by the person to type at once
                onKeyDown={(event) => {
                  // Ctrl/⌘ + Enter reads it, like sending a message.
                  if (!(
                    event.key === 'Enter' &&
                    (event.metaKey || event.ctrlKey) &&
                    text.trim()
                  )) {
                    return
                  }

                  event.preventDefault()
                  handleRead()
                }}
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={close}
                >
                  {t('form.cancel')}
                </Button>
                <Button
                  onClick={handleRead}
                  disabled={!text.trim() || isPending}
                  isLoading={isPending}
                >
                  {t('finances.quickAdd.read')}
                </Button>
              </div>
            </FormProvider>
          )}
        </section>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          aria-label={t('finances.quickAdd.title')}
          title={t('finances.quickAdd.hint')}
        >
          <Keyboard className="size-4" />
          <span className="hidden sm:inline">
            {t('finances.quickAdd.title')}
          </span>
        </Button>
      )}
      <AiNotice {...notice} />
    </>
  )
}
