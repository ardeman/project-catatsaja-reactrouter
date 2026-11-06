import { Keyboard, LoaderCircle, ScanText, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { AiNotice } from '~/components/base/ai-notice'
import { Button } from '~/components/base/button'
import { CategoryIcon } from '~/components/base/category-icon'
import { Textarea } from '~/components/base/textarea'
import { Button as UIButton } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { categoryKeywords } from '~/lib/constants/category-keywords'
import { financeCategories } from '~/lib/constants/finance'
import { useAiConsent } from '~/lib/hooks/use-ai-consent'
import { useMoney } from '~/lib/hooks/use-money'
import { useReadTypedEntries } from '~/lib/hooks/use-read-typed-entries'
import { useScanReceipt } from '~/lib/hooks/use-scan-receipt'
import { TReceipt, TTypedEntries } from '~/lib/types/finance'
import { suggestCategory } from '~/lib/utils/category-classifier'
import { clearDraft, readDraft, writeDraft } from '~/lib/utils/drafts'
import {
  lastCategory,
  matchCurrency,
  newEntryId,
  suggestRate,
  summarize,
  today,
} from '~/lib/utils/finance'
import { typedToEntries } from '~/lib/utils/receipt'
import { linkGoal } from '~/lib/utils/savings-goals'
import { cn } from '~/lib/utils/shadcn'

import { GoalPicker } from './goal-picker'
import { ReceiptReview } from './receipt-review.client'
import { TQuickAddProperties } from './type'

// Starts under the totals and the Add button (6.75rem below the top inset on
// phones, 7.75rem from md) and stops clear of the bottom menu (5.5rem above
// --nav-bottom), so its buttons stay reachable.
const panelClassName =
  'motion-enter glass-surface glass-float order-last grid max-h-[calc(100dvh-12.25rem-var(--top-inset)-var(--summary-height,0px)-var(--nav-bottom))] basis-full gap-3 overflow-y-auto rounded-xl border p-3 shadow-lg sm:p-4 md:max-h-[calc(100dvh-8.75rem-var(--summary-height,0px))] [&_[role=combobox]]:bg-background [&_input]:bg-background [&_textarea]:bg-background'

// The Gemini menu on a book: scan a receipt photo, or type entries as a line
// of text ("makan siang 45rb kemarin, gaji 5jt"). Gemini reads either into
// entries that are checked before they are added. The photo or text goes to
// Google only when the person chooses a photo or presses Read, after agreeing
// once to `AiNotice`.
export const QuickAdd = (properties: TQuickAddProperties) => {
  const {
    book,
    currencies,
    history,
    onAdd,
    draftKey,
    isPrivate = false,
    goals = [],
  } = properties
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const { run, notice } = useAiConsent()
  const { mutate: read, isPending } = useReadTypedEntries()
  const { mutate: scan, isPending: isScanning } = useScanReceipt()
  const fileInput = useRef<HTMLInputElement>(null)
  const [receipt, setReceipt] = useState<TReceipt>()
  // Text typed and not read yet comes back, with the form open.
  const [draft] = useState(() =>
    draftKey ? readDraft<string>(draftKey) : undefined,
  )
  const [isOpen, setIsOpen] = useState(!!draft)
  const [typed, setTyped] = useState<TTypedEntries>()
  // Entries left out, by their place in the list.
  const [skipped, setSkipped] = useState<Set<number>>(new Set())
  // The savings goal the expenses are linked to.
  const [goal, setGoal] = useState<string>()
  const textForm = useForm<{ text: string }>({
    defaultValues: { text: draft ?? '' },
  })
  const text = useWatch({ control: textForm.control, name: 'text' })

  useEffect(() => {
    if (!draftKey) return
    if (text.trim()) writeDraft(draftKey, text, isPrivate)
    else clearDraft(draftKey)
  }, [text, draftKey, isPrivate])

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
    .map(({ entry }) => linkGoal(entry, goal))
  const { income, expense } = summarize(chosen)

  const formatDay = (day: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(`${day}T00:00:00Z`))

  const close = () => {
    if (draftKey) clearDraft(draftKey)
    setIsOpen(false)
    setReceipt(undefined)
    setTyped(undefined)
    setGoal(undefined)
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

  // The file picker opens inside the click (or the notice's button).
  const handleScanPick = () => run(() => fileInput.current?.click())

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // The same photo can be chosen again after cancelling.
    event.target.value = ''
    if (!file) return
    const result = await scan(file)
    if (result) setReceipt(result)
  }

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
      <input
        ref={fileInput}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={handleFile}
        aria-hidden="true"
        tabIndex={-1}
      />
      {receipt ? (
        <section
          aria-labelledby="receipt-review-title"
          className={panelClassName}
        >
          <ReceiptReview
            {...properties}
            receipt={receipt}
            onCancel={() => setReceipt(undefined)}
            onAdd={(entries) => {
              onAdd(entries)
              setReceipt(undefined)
            }}
          />
        </section>
      ) : isOpen ? (
        <section
          aria-labelledby="quick-add-title"
          className={panelClassName}
        >
          <h2
            id="quick-add-title"
            className="text-base font-semibold"
          >
            <Keyboard className="mr-2 inline size-4" />
            {t('finances.quickAdd.type')}
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
              {chosen.some((entry) => entry.type === 'expense') && (
                <GoalPicker
                  goals={goals}
                  value={goal}
                  onChange={setGoal}
                />
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <UIButton
              type="button"
              variant="outline"
              disabled={isScanning}
              aria-label={t('finances.quickAdd.gemini')}
              aria-busy={isScanning}
              data-guide="quick-add"
              title={t('finances.quickAdd.methods')}
            >
              {isScanning ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              <span className="hidden sm:inline">
                {t('finances.quickAdd.gemini')}
              </span>
            </UIButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="glass-surface"
          >
            <DropdownMenuItem onSelect={handleScanPick}>
              <ScanText className="size-4" />
              {t('finances.receipt.scan')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsOpen(true)}>
              <Keyboard className="size-4" />
              {t('finances.quickAdd.type')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {isScanning && (
        <p
          role="status"
          className="order-last basis-full text-center text-xs text-muted-foreground"
        >
          {/* On a pill: the row floats over the entries. */}
          <span className="rounded-full bg-background/90 px-3 py-1">
            {t('finances.receipt.reading')}
          </span>
        </p>
      )}
      <AiNotice {...notice} />
    </>
  )
}
