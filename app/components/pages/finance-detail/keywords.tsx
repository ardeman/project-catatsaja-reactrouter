import { Pencil, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { useMoney } from '~/lib/hooks/use-money'
import { usePlan } from '~/lib/hooks/use-plan'
import {
  TFinanceCurrency,
  TFinanceEntry,
  TFinanceForm,
} from '~/lib/types/finance'
import { formatShare } from '~/lib/utils/finance-analysis'
import { keywordTotals } from '~/lib/utils/keywords'
import { cn } from '~/lib/utils/shadcn'

import { KeywordsEditor } from './keywords-editor'
import { Section } from './section'

type TProperties = {
  // The entries in the analysis's range.
  entries: TFinanceEntry[]
  // Expenses first when both are shown.
  types: TFinanceEntry['type'][]
  book: TFinanceCurrency
  isReadOnly: boolean
}

// The book's keywords (a Plus feature) with what the entries whose
// description has them add up to. Everyone the book is shared with sees
// them; only a writer with Plus changes them. Someone without Plus and
// without keywords is told what Plus would add.
export const Keywords = ({ entries, types, book, isReadOnly }: TProperties) => {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const { hasPlus } = usePlan()
  const { control } = useFormContext<TFinanceForm>()
  const keywords = useWatch({ control, name: 'keywords' }) ?? []
  const [isEditing, setIsEditing] = useState(false)
  const percent = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  })

  const canEdit = !isReadOnly && hasPlus
  const lists = types
    .map((type) => ({ type, totals: keywordTotals(entries, type, keywords) }))
    .filter(({ totals }) => totals.length > 0)
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
  if (!canEdit && lists.length === 0) return

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
      {lists.length > 0 ? (
        lists.map(({ type, totals }) => {
          const largest = Math.max(0, ...totals.map((row) => row.total))
          return (
            <div
              key={type}
              className="grid gap-2"
            >
              {types.length > 1 && (
                <h3 className="text-xs text-muted-foreground">
                  {t(`finances.form.type.${type}`)}
                </h3>
              )}
              <ul className="grid gap-3">
                {totals.map(({ id, text, count, total, share }) => (
                  <li
                    key={id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 text-sm"
                  >
                    <span className="grid">
                      <span className="truncate">{text}</span>
                      <span className="text-xs text-muted-foreground">
                        {t('finances.analysis.keywords.count', { count })}
                      </span>
                    </span>
                    <span className="text-right tabular-nums">
                      <span className="font-medium">{money(total, book)}</span>{' '}
                      <span className="text-xs text-muted-foreground">
                        {formatShare(percent, share)}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'col-span-2 h-2 rounded-r-[4px]',
                        type === 'expense' ? 'bg-viz-expense' : 'bg-viz-income',
                      )}
                      style={{
                        width: `${Math.max((total / (largest || 1)) * 100, 1)}%`,
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )
        })
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
        <p className="text-xs text-muted-foreground">
          {t('finances.analysis.keywords.plusToEdit')}
        </p>
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
