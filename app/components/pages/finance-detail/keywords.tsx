import { Pencil, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { PlusNote } from '~/components/base/plus-note'
import { Button } from '~/components/ui/button'
import { useMoney } from '~/lib/hooks/use-money'
import {
  TFinanceCurrency,
  TFinanceEntry,
  TFinanceForm,
} from '~/lib/types/finance'
import { formatShare } from '~/lib/utils/finance-analysis'
import { combinedKeywordTotals } from '~/lib/utils/keywords'
import { cn } from '~/lib/utils/shadcn'

import { KeywordsEditor } from './keywords-editor'
import { Section } from './section'

const barClass = {
  expense: 'bg-viz-expense',
  income: 'bg-viz-income',
} as const

type TProperties = {
  // The entries in the analysis's range.
  entries: TFinanceEntry[]
  // Expenses first when both are shown.
  types: TFinanceEntry['type'][]
  book: TFinanceCurrency
  isReadOnly: boolean
  // Whether the book's Plus features can be changed (`useBookPlan`).
  hasPlus: boolean
}

// The book's keywords (a Plus feature) with what the entries whose
// description has them add up to. Everyone the book is shared with sees
// them; only a writer with Plus changes them. Someone without Plus and
// without keywords is told what Plus would add.
export const Keywords = ({
  entries,
  types,
  book,
  isReadOnly,
  hasPlus,
}: TProperties) => {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const { control } = useFormContext<TFinanceForm>()
  const keywords = useWatch({ control, name: 'keywords' }) ?? []
  const [isEditing, setIsEditing] = useState(false)
  const percent = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  })

  const canEdit = !isReadOnly && hasPlus
  // With both types shown, a keyword's income and expense share one row.
  const rows = combinedKeywordTotals(entries, types, keywords)
  const largestOf = (type: TFinanceEntry['type']) =>
    Math.max(
      0,
      ...rows.flatMap(({ totals }) =>
        totals.filter((item) => item.type === type).map(({ total }) => total),
      ),
    )
  const largest = Math.max(...types.map((type) => largestOf(type)))
  // A bar's share of the full width, never too thin to see.
  const widthOf = (total: number) => Math.max((total / (largest || 1)) * 100, 1)
  // With both types shown, the zero line sits where the largest spending
  // and the largest income meet, so neither side is left mostly empty.
  const span = largestOf('expense') + largestOf('income') || 1
  const zero = (largestOf('expense') / span) * 100
  const sideWidthOf = (total: number) => Math.max((total / span) * 100, 1)
  const hasKeywords = keywords.length > 0

  if (!hasKeywords && !canEdit) {
    if (isReadOnly) return
    return (
      <Section
        id="keywords"
        isFoldedFirst
        title={t('finances.analysis.keywords.title')}
        subtitle={t('finances.analysis.keywords.plus')}
        action={
          <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
            <Sparkles
              aria-hidden="true"
              className="size-3"
            />
            {t('plus.soon')}
          </span>
        }
      >
        <p className="text-sm text-muted-foreground">
          {t('finances.analysis.keywords.hint')}
        </p>
      </Section>
    )
  }
  if (!canEdit && rows.length === 0) return

  return (
    <Section
      id="keywords"
      isFoldedFirst={!hasKeywords}
      title={t('finances.analysis.keywords.title')}
      summary={t('finances.analysis.keywords.saved', {
        count: keywords.length,
      })}
      action={
        canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-my-1 -mr-2 gap-1"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="size-3.5" />
            {t(
              hasKeywords
                ? 'finances.analysis.keywords.edit'
                : 'finances.analysis.keywords.create',
            )}
          </Button>
        )
      }
    >
      {rows.length > 0 ? (
        <div className="grid gap-2">
          {types.length > 1 && (
            <ul className="flex gap-3 text-xs text-muted-foreground">
              {types.map((type) => (
                <li
                  key={type}
                  className="flex items-center gap-1.5"
                >
                  <span
                    aria-hidden="true"
                    className={cn('size-2.5 rounded-[3px]', barClass[type])}
                  />
                  {t(`finances.summary.${type}`)}
                </li>
              ))}
            </ul>
          )}
          <ul className="grid gap-2.5">
            {rows.map(({ id, text, count, totals }) => {
              const isBoth = types.length > 1
              // Income less expenses, when the keyword has both.
              const totalOf = (type: TFinanceEntry['type']) =>
                totals.find((item) => item.type === type)?.total ?? 0
              const net =
                totals.length > 1
                  ? totalOf('income') - totalOf('expense')
                  : undefined
              // With both types shown, spending is signed minus and
              // income plus, matching the side of the zero line.
              const amountOf = (type: TFinanceEntry['type'], total: number) =>
                isBoth
                  ? money(type === 'expense' ? -total : total, book, true)
                  : money(total, book)
              return (
                <li
                  key={id}
                  className="grid gap-1 text-sm"
                >
                  <span className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium">{text}</span>
                      <span className="text-xs text-muted-foreground">
                        {' · '}
                        {t('finances.analysis.keywords.count', { count })}
                      </span>
                    </span>
                    {net === undefined ? (
                      totals.map(({ type, total }) => (
                        <span
                          key={type}
                          className="shrink-0 tabular-nums"
                        >
                          {isBoth && (
                            <span className="sr-only">
                              {t(`finances.summary.${type}`)}:{' '}
                            </span>
                          )}
                          <span className="font-medium">
                            {amountOf(type, total)}
                          </span>
                        </span>
                      ))
                    ) : (
                      <span
                        className={cn(
                          'shrink-0 font-medium tabular-nums',
                          net > 0 && 'text-income',
                          net < 0 && 'text-expense',
                        )}
                      >
                        {t('finances.analysis.keywords.net', {
                          amount: money(net, book, true),
                        })}
                      </span>
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className="relative h-1.5 overflow-hidden rounded-full bg-muted"
                  >
                    {isBoth ? (
                      // Spending to the left of the zero line, income
                      // to the right.
                      <>
                        {totals.map(({ type, total }) => (
                          <span
                            key={type}
                            className={cn(
                              'absolute inset-y-0',
                              type === 'expense'
                                ? 'rounded-l-full'
                                : 'rounded-r-full',
                              barClass[type],
                            )}
                            style={{
                              width: `${sideWidthOf(total)}%`,
                              ...(type === 'expense'
                                ? { right: `${100 - zero}%` }
                                : { left: `${zero}%` }),
                            }}
                          />
                        ))}
                        {zero > 0 && zero < 100 && (
                          <span
                            className="absolute inset-y-0 w-px -translate-x-1/2 bg-background"
                            style={{ left: `${zero}%` }}
                          />
                        )}
                      </>
                    ) : (
                      totals.map(({ type, total }) => (
                        <span
                          key={type}
                          className={cn(
                            'absolute inset-y-0 left-0 rounded-full',
                            barClass[type],
                          )}
                          style={{ width: `${widthOf(total)}%` }}
                        />
                      ))
                    )}
                  </span>
                  {net === undefined ? (
                    // The share under the bar, on its side of the zero
                    // line.
                    totals.map(({ type, share }) => (
                      <span
                        key={type}
                        className={cn(
                          'text-xs text-muted-foreground tabular-nums',
                          !(isBoth && type === 'expense') && 'text-right',
                        )}
                      >
                        {t(`finances.analysis.keywords.shareOf.${type}`, {
                          share: formatShare(percent, share),
                          // React escapes text: "<1%" stays.
                          interpolation: { escapeValue: false },
                        })}
                      </span>
                    ))
                  ) : (
                    // Each side's figure under its half of the bar.
                    <span className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
                      {totals.map(({ type, total, share }) => (
                        <span key={type}>
                          <span className="sr-only">
                            {t(`finances.summary.${type}`)}:{' '}
                          </span>
                          {amountOf(type, total)} ·{' '}
                          {t(`finances.analysis.keywords.shareOf.${type}`, {
                            share: formatShare(percent, share),
                            interpolation: { escapeValue: false },
                          })}
                        </span>
                      ))}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t(
            hasKeywords
              ? 'finances.analysis.keywords.emptyRange'
              : 'finances.analysis.keywords.hint',
          )}
        </p>
      )}
      {!isReadOnly && !hasPlus && (
        <PlusNote>{t('finances.analysis.keywords.plusToEdit')}</PlusNote>
      )}
      {canEdit && (
        <KeywordsEditor
          open={isEditing}
          setOpen={setIsEditing}
        />
      )}
    </Section>
  )
}
