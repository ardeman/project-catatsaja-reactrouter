import { ScanText } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { AiNotice } from '~/components/base/ai-notice'
import { Button } from '~/components/base/button'
import { CategoryIcon } from '~/components/base/category-icon'
import { DatePicker } from '~/components/base/date-picker'
import { Segmented } from '~/components/base/segmented'
import { Checkbox } from '~/components/ui/checkbox'
import { categoryKeywords } from '~/lib/constants/category-keywords'
import { financeCategories } from '~/lib/constants/finance'
import { useAiConsent } from '~/lib/hooks/use-ai-consent'
import { useMoney } from '~/lib/hooks/use-money'
import { useScanReceipt } from '~/lib/hooks/use-scan-receipt'
import { TReceipt, TReceiptMode } from '~/lib/types/finance'
import { suggestCategory } from '~/lib/utils/category-classifier'
import {
  lastCategory,
  matchCurrency,
  newEntryId,
  suggestRate,
  today,
} from '~/lib/utils/finance'
import {
  receiptDate,
  receiptDiscount,
  receiptLines,
  receiptMismatch,
  receiptToEntries,
  receiptTotal,
} from '~/lib/utils/receipt'
import { cn } from '~/lib/utils/shadcn'

import { TReceiptScanProperties } from './type'

// Whether text is a YYYY-MM-DD date that can be shown as a day.
const isRealDayText = (text: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(text) &&
  !Number.isNaN(Date.parse(`${text}T00:00:00Z`))

// Reads a receipt photo with Gemini and turns it into entries, which the
// person checks before they are added. The photo goes to Google only when
// they choose one, after agreeing once to a notice saying so (`AiNotice`).
export const ReceiptScan = (properties: TReceiptScanProperties) => {
  const { book, currencies, history, onAdd } = properties
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const { mutate: scan, isPending } = useScanReceipt()
  const { run, notice } = useAiConsent()
  const fileInput = useRef<HTMLInputElement>(null)
  const [receipt, setReceipt] = useState<TReceipt>()
  const [mode, setMode] = useState<TReceiptMode>('total')
  // Lines left out when adding each item, by their place on the receipt.
  const [skipped, setSkipped] = useState<Set<number>>(new Set())
  // The date the entries get: the receipt's, which the person can change.
  const dateForm = useForm<{ date: string }>({
    defaultValues: { date: today() },
  })
  const date = dateForm.watch('date')
  // The date as read, and why it is worth checking, if it is.
  const readDate = useMemo(
    () => (receipt ? receiptDate(receipt.date, today()) : undefined),
    [receipt],
  )

  const { currency, isCurrencyUnknown } = useMemo(
    () => matchCurrency(receipt?.currency, book, currencies),
    [receipt, book, currencies],
  )
  const entries = useMemo(() => {
    if (!receipt) return []
    const categoryFor = (description: string) =>
      suggestCategory({
        description,
        history,
        keywords: categoryKeywords,
        categories: financeCategories,
        type: 'expense',
      })?.category
    return receiptToEntries({
      receipt,
      mode,
      date,
      currency,
      rate: suggestRate(currency.code, book, currencies),
      categoryFor,
      fallbackCategory: lastCategory('expense', history) ?? 'otherExpenses',
      newId: newEntryId,
    })
  }, [receipt, mode, date, currency, book, currencies, history])

  const fractionDigits = currency.maximumFractionDigits
  const total = receipt ? receiptTotal(receipt, fractionDigits) : 0
  const discount = receipt ? receiptDiscount(receipt, fractionDigits) : 0
  // Each item's discount, in the same order as the entries when adding
  // each item.
  const lineDiscounts = useMemo(
    () =>
      receipt
        ? receiptLines(receipt, fractionDigits).map((line) => line.discount)
        : [],
    [receipt, fractionDigits],
  )
  const { lines: linesTotal, isMismatch: isOff } = receipt
    ? receiptMismatch(receipt, fractionDigits)
    : { lines: 0, isMismatch: false }
  // Only worth saying while every line is going to be added.
  const isMismatch = mode === 'items' && isOff && skipped.size === 0
  const chosen =
    mode === 'items'
      ? entries.filter((_, index) => !skipped.has(index))
      : entries
  // What the ticked items come to, rounded like the currency.
  const chosenTotal =
    Math.round(
      chosen.reduce((sum, entry) => sum + entry.quantity * entry.amount, 0) *
        10 ** fractionDigits,
    ) /
    10 ** fractionDigits

  const toggleLine = (index: number) =>
    setSkipped((current) => {
      const next = new Set(current)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  const formatDay = (day: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(new Date(`${day}T00:00:00Z`))
  // Shown until the person picks a date themselves.
  const dateIssue =
    readDate?.issue && date === readDate.date ? readDate.issue : undefined

  // The file picker opens inside the click (or the notice's button).
  const handleScanClick = () => run(() => fileInput.current?.click())

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // The same photo can be chosen again after cancelling.
    event.target.value = ''
    if (!file) return
    const read = await scan(file)
    if (!read) return
    setMode(read.items.length > 1 ? 'items' : 'total')
    setSkipped(new Set())
    dateForm.reset({ date: receiptDate(read.date, today()).date })
    setReceipt(read)
  }

  const handleAdd = () => {
    onAdd(chosen)
    setReceipt(undefined)
  }

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        aria-hidden="true"
        tabIndex={-1}
      />
      {receipt ? (
        <section
          aria-labelledby="receipt-review-title"
          className="motion-enter glass-surface order-last grid basis-full gap-3 rounded-xl border p-3 sm:p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="receipt-review-title"
              className="text-base font-semibold"
            >
              {t('finances.receipt.review')}
            </h2>
            <Segmented
              label={t('finances.receipt.mode.label')}
              value={mode}
              options={[
                { value: 'total', label: t('finances.receipt.mode.total') },
                { value: 'items', label: t('finances.receipt.mode.items') },
              ]}
              onChange={setMode}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {[
              receipt.merchant.trim(),
              money(total, currency),
              discount > 0
                ? t('finances.receipt.discount', {
                    amount: money(discount, currency),
                  })
                : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <FormProvider {...dateForm}>
            <div className="grid max-w-xs gap-1">
              <DatePicker
                name="date"
                label={t('finances.form.date.label')}
              />
            </div>
          </FormProvider>
          {dateIssue && (
            <p
              role="status"
              className="text-xs text-muted-foreground"
            >
              {t(`finances.receipt.dateIssue.${dateIssue}`, {
                read: isRealDayText(receipt.date)
                  ? formatDay(receipt.date)
                  : receipt.date,
                date: formatDay(date),
              })}
            </p>
          )}
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('finances.receipt.noLines')}
            </p>
          ) : (
            <ul className="grid divide-y rounded-lg border">
              {entries.map((entry, index) => {
                const isSkipped = mode === 'items' && skipped.has(index)
                const lineDiscount =
                  mode === 'items' ? (lineDiscounts[index] ?? 0) : 0
                const content = (
                  <>
                    <CategoryIcon
                      category={entry.category}
                      chip
                    />
                    <span className="grid min-w-0">
                      <span className="truncate text-sm font-medium">
                        {entry.description ||
                          t(`finances.form.category.${entry.category}.label`)}
                      </span>
                      {(entry.quantity !== 1 || lineDiscount > 0) && (
                        <span className="truncate text-xs text-muted-foreground">
                          {[
                            entry.quantity === 1
                              ? ''
                              : `${entry.quantity} × ${money(entry.amount, currency)}`,
                            lineDiscount > 0
                              ? t('finances.receipt.lineDiscount', {
                                  amount: money(lineDiscount, currency),
                                })
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-medium text-expense tabular-nums">
                      {money(entry.quantity * entry.amount, currency)}
                    </span>
                  </>
                )
                return (
                  <li key={entry.id}>
                    {mode === 'items' ? (
                      // Each item can be left out; the whole row toggles it.
                      <label
                        className={cn(
                          'grid cursor-pointer grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 hover:bg-muted/50',
                          isSkipped && 'opacity-50',
                        )}
                      >
                        <Checkbox
                          checked={!isSkipped}
                          onCheckedChange={() => toggleLine(index)}
                        />
                        {content}
                      </label>
                    ) : (
                      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2">
                        {content}
                      </div>
                    )}
                  </li>
                )
              })}
              {mode === 'items' && (
                <li className="flex items-center justify-between gap-3 bg-muted/40 px-3 py-2 text-sm font-semibold">
                  <span>
                    {t('finances.receipt.chosenTotal', {
                      count: chosen.length,
                    })}
                  </span>
                  <span className="text-expense tabular-nums">
                    {money(chosenTotal, currency)}
                  </span>
                </li>
              )}
            </ul>
          )}
          {isMismatch && (
            <p className="text-xs text-muted-foreground">
              {t('finances.receipt.mismatch', {
                lines: money(linesTotal, currency),
                total: money(total, currency),
              })}
            </p>
          )}
          {isCurrencyUnknown && (
            <p className="text-xs text-muted-foreground">
              {t('finances.receipt.currencyUnknown', {
                code: receipt.currency.toUpperCase(),
                book: book.code,
              })}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('finances.receipt.check')}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setReceipt(undefined)}
            >
              {t('form.cancel')}
            </Button>
            <Button
              onClick={handleAdd}
              disabled={chosen.length === 0}
            >
              {t('finances.receipt.add', { count: chosen.length })}
            </Button>
          </div>
        </section>
      ) : (
        <Button
          variant="outline"
          onClick={handleScanClick}
          isLoading={isPending}
          disabled={isPending}
          aria-label={t('finances.receipt.scan')}
          title={t('finances.receipt.scanHint')}
        >
          <ScanText className="size-4" />
          <span className="hidden sm:inline">{t('finances.receipt.scan')}</span>
        </Button>
      )}
      {isPending && (
        <p
          role="status"
          className="order-last basis-full text-center text-xs text-muted-foreground"
        >
          {t('finances.receipt.reading')}
        </p>
      )}
      <AiNotice {...notice} />
    </>
  )
}
