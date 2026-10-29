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
import { summarize, today } from '~/lib/utils/finance'
import { bookSavings, savingsPlan } from '~/lib/utils/savings-goals'
import { cn } from '~/lib/utils/shadcn'

import { GoalsEditor } from './goals-editor'
import { Section } from './section'

type TProperties = {
  // All the book's entries: savings are the whole book's, whatever range
  // the analysis shows.
  entries: TFinanceEntry[]
  book: TFinanceCurrency
  isReadOnly: boolean
  // Whether the book's Plus features can be changed (`useBookPlan`).
  hasPlus: boolean
}

// The book's savings goals (a Plus feature): what to put aside on each
// payday so every goal is ready when its month starts, from what the book
// already holds. Everyone the book is shared with sees them; only a writer
// with Plus changes them. Someone without Plus and without goals is told
// what Plus would add.
export const Goals = ({ entries, book, isReadOnly, hasPlus }: TProperties) => {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const { control } = useFormContext<TFinanceForm>()
  const goals = useWatch({ control, name: 'goals' }) ?? []
  const payday = useWatch({ control, name: 'payday' }) ?? null
  const accounts = useWatch({ control, name: 'accounts' }) ?? []
  const [isEditing, setIsEditing] = useState(false)
  const [date] = useState(today)
  const month = date.slice(0, 7)
  const monthName = new Intl.DateTimeFormat(i18n.language, {
    month: 'long',
    year: 'numeric',
  })

  const canEdit = !isReadOnly && hasPlus
  const savings = bookSavings(accounts, summarize(entries).balance)
  const plan = savingsPlan({
    goals,
    entries,
    savings: savings.amount,
    payday,
    today: date,
    fractionDigits: book.maximumFractionDigits,
  })
  const hasGoals = goals.length > 0

  if (!hasGoals && !canEdit) {
    if (isReadOnly) return
    return (
      <Section
        id="goals"
        isFoldedFirst
        title={t('finances.analysis.goals.title')}
        subtitle={t('finances.analysis.goals.plus')}
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
          {t('finances.analysis.goals.hint')}
        </p>
      </Section>
    )
  }
  if (!canEdit && plan.months.length === 0 && plan.done.length === 0) return

  return (
    <Section
      id="goals"
      isFoldedFirst={!hasGoals}
      title={t('finances.analysis.goals.title')}
      subtitle={t(
        savings.from === 'accounts'
          ? 'finances.analysis.goals.savingsAccounts'
          : 'finances.analysis.goals.savingsBalance',
        { amount: money(savings.amount, book) },
      )}
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
              hasGoals
                ? 'finances.analysis.goals.edit'
                : 'finances.analysis.goals.create',
            )}
          </Button>
        )
      }
    >
      {plan.months.length > 0 ? (
        <>
          <div className="grid gap-0.5">
            {payday === null ? (
              <p className="text-sm text-muted-foreground">
                {t('finances.analysis.goals.setPayday')}
              </p>
            ) : plan.monthly > 0 ? (
              <>
                <p className="text-lg font-semibold tabular-nums">
                  {t('finances.analysis.goals.monthly', {
                    amount: money(plan.monthly, book),
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('finances.analysis.goals.monthlyHint', { day: payday })}
                </p>
              </>
            ) : (
              plan.neededNow === 0 && (
                <p className="text-sm">
                  {t('finances.analysis.goals.covered')}
                </p>
              )
            )}
            {plan.neededNow > 0 && (
              <p className="text-sm text-destructive-text">
                {t('finances.analysis.goals.neededNow', {
                  amount: money(plan.neededNow, book),
                })}
              </p>
            )}
          </div>

          <ol className="grid gap-3">
            {plan.months.map(
              ({
                due,
                goals: monthGoals,
                total,
                shortfall,
                paydays,
                perPayday,
              }) => (
                <li
                  key={due}
                  className="grid gap-1 border-t pt-3 text-sm"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-medium">
                      {monthName.format(new Date(`${due}-01T00:00:00`))}
                    </h3>
                    <span className="shrink-0 font-medium whitespace-nowrap tabular-nums">
                      {money(total, book)}
                    </span>
                  </div>
                  <ul className="grid gap-0.5 text-muted-foreground">
                    {monthGoals.map((goal) => (
                      <li key={goal.id}>
                        <div className="flex justify-between gap-2">
                          <span className="truncate">{goal.name}</span>
                          {/* A month's only goal is its total, unless part
                              of it was paid already. */}
                          {(goal.realized > 0 || monthGoals.length > 1) && (
                            <span className="shrink-0 whitespace-nowrap tabular-nums">
                              {money(goal.amount ?? 0, book)}
                            </span>
                          )}
                        </div>
                        {goal.realized > 0 && (
                          <p className="text-xs tabular-nums">
                            {t('finances.analysis.goals.realized', {
                              spent: money(goal.realized, book),
                            })}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p
                    className={cn(
                      'text-xs',
                      paydays === 0 && shortfall > 0
                        ? 'text-destructive-text'
                        : 'text-muted-foreground',
                    )}
                  >
                    {shortfall > 0
                      ? [
                          t('finances.analysis.goals.short', {
                            amount: money(shortfall, book),
                          }),
                          paydays === 0 &&
                            t('finances.analysis.goals.noPaydays'),
                          perPayday !== undefined &&
                            t('finances.analysis.goals.paydays', {
                              count: paydays,
                              amount: money(perPayday, book),
                            }),
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      : t('finances.analysis.goals.ready')}
                  </p>
                </li>
              ),
            )}
          </ol>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('finances.analysis.goals.hint')}
        </p>
      )}

      {plan.done.length > 0 && (
        <details className="border-t pt-3 text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            {t('finances.analysis.goals.doneTitle', {
              count: plan.done.length,
            })}
          </summary>
          <ul className="mt-2 grid gap-0.5">
            {plan.done.map((goal) => (
              <li
                key={goal.id}
                className="flex justify-between gap-2"
              >
                <span className="truncate">
                  {goal.name} ·{' '}
                  {monthName.format(new Date(`${goal.due}-01T00:00:00`))}
                </span>
                <span className="shrink-0 whitespace-nowrap text-muted-foreground tabular-nums">
                  {goal.realized === 0
                    ? money(goal.amount ?? 0, book)
                    : t('finances.analysis.goals.spentOf', {
                        spent: money(goal.realized, book),
                        amount: money(goal.amount ?? 0, book),
                      })}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {!isReadOnly && !hasPlus && (
        <PlusNote>{t('finances.analysis.goals.plusToEdit')}</PlusNote>
      )}
      {canEdit && (
        <GoalsEditor
          open={isEditing}
          setOpen={setIsEditing}
          book={book}
          entries={entries}
          month={month}
        />
      )}
    </Section>
  )
}
