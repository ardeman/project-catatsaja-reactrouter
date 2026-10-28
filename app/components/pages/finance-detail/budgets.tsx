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
import { budgetUsage, monthOf } from '~/lib/utils/budgets'
import { today } from '~/lib/utils/finance'
import { cn } from '~/lib/utils/shadcn'

import { BudgetIcon, BudgetsEditor, budgetLabelKey } from './budgets-editor'
import { Section } from './section'

type TProperties = {
  // All the book's entries: budgets are for this month, whatever range
  // the analysis shows.
  entries: TFinanceEntry[]
  book: TFinanceCurrency
  isReadOnly: boolean
}

// The book's budgets (a Plus feature): the monthly limit on all of its
// spending and on each category, and what is left of it this month. Everyone the book is shared with sees
// them; only a writer with Plus changes them. Someone without Plus and
// without budgets is told what Plus would add.
export const Budgets = ({ entries, book, isReadOnly }: TProperties) => {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const { hasPlus } = usePlan()
  const { control } = useFormContext<TFinanceForm>()
  const budgets = useWatch({ control, name: 'budgets' }) ?? []
  const [isEditing, setIsEditing] = useState(false)
  const [month] = useState(() => monthOf(today()))
  const monthName = new Intl.DateTimeFormat(i18n.language, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${month}-01T00:00:00`))

  const canEdit = !isReadOnly && hasPlus
  const usage = budgetUsage(entries, budgets, month)
  const hasBudgets = budgets.length > 0

  if (!hasBudgets && !canEdit) {
    if (isReadOnly) return
    return (
      <Section
        title={t('finances.analysis.budgets.title')}
        subtitle={t('finances.analysis.budgets.plus')}
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
          {t('finances.analysis.budgets.hint')}
        </p>
      </Section>
    )
  }
  if (!canEdit && usage.length === 0) return

  return (
    <Section
      title={t('finances.analysis.budgets.title')}
      subtitle={monthName}
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
              hasBudgets
                ? 'finances.analysis.budgets.edit'
                : 'finances.analysis.budgets.create',
            )}
          </Button>
        )
      }
    >
      {usage.length > 0 ? (
        <ul className="grid gap-3">
          {usage.map(({ id, category, limit, spent, left, share }) => (
            <li
              key={id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 text-sm"
            >
              <BudgetIcon category={category} />
              <span className="truncate">{t(budgetLabelKey(category))}</span>
              {/* What is left above what was spent, so the category's name
                  keeps its width on a phone. */}
              <span className="grid text-right tabular-nums">
                <span
                  className={cn(
                    'font-medium',
                    left < 0 && 'text-destructive-text',
                  )}
                >
                  {t(
                    left < 0
                      ? 'finances.analysis.budgets.over'
                      : 'finances.analysis.budgets.left',
                    { amount: money(Math.abs(left), book) },
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('finances.analysis.budgets.of', {
                    spent: money(spent, book),
                    limit: money(limit, book),
                  })}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="col-span-3 h-2 overflow-hidden rounded-[4px] bg-muted"
              >
                <span
                  className={cn(
                    'block h-full rounded-r-[4px]',
                    left < 0 ? 'bg-destructive' : 'bg-viz-expense',
                  )}
                  style={{ width: `${Math.min(share, 1) * 100}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('finances.analysis.budgets.hint')}
        </p>
      )}
      {!isReadOnly && !hasPlus && (
        <p className="text-xs text-muted-foreground">
          {t('finances.analysis.budgets.plusToEdit')}
        </p>
      )}
      {canEdit && (
        <BudgetsEditor
          open={isEditing}
          setOpen={setIsEditing}
          book={book}
        />
      )}
    </Section>
  )
}
