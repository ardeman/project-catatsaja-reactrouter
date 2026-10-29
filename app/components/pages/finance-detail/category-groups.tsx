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
import { groupTotals, ungrouped } from '~/lib/utils/category-groups'
import { formatShare } from '~/lib/utils/finance-analysis'
import { cn } from '~/lib/utils/shadcn'

import { CategoryGroupsEditor } from './category-groups-editor'
import { Section } from './section'

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

// The book's own groups of categories (a Plus feature) with their totals
// and shares. Everyone the book is shared with sees them; only a writer
// with Plus changes them. Someone without Plus and without groups is told
// what Plus would add.
export const CategoryGroups = ({
  entries,
  types,
  book,
  isReadOnly,
  hasPlus,
}: TProperties) => {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const { control } = useFormContext<TFinanceForm>()
  const groups = useWatch({ control, name: 'categoryGroups' }) ?? []
  const [isEditing, setIsEditing] = useState(false)
  const percent = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  })

  const canEdit = !isReadOnly && hasPlus
  const lists = types
    .map((type) => ({ type, totals: groupTotals(entries, type, groups) }))
    .filter(({ totals }) => totals.length > 0)
  const hasGroups = groups.length > 0

  if (!hasGroups && !canEdit) {
    if (isReadOnly) return
    return (
      <Section
        id="groups"
        isFoldedFirst
        title={t('finances.analysis.groups.title')}
        subtitle={t('finances.analysis.groups.plus')}
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
          {t('finances.analysis.groups.hint')}
        </p>
      </Section>
    )
  }
  if (!canEdit && lists.length === 0) return

  return (
    <Section
      id="groups"
      isFoldedFirst={!hasGroups}
      title={t('finances.analysis.groups.title')}
      summary={t('finances.analysis.groups.saved', { count: groups.length })}
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
              hasGroups
                ? 'finances.analysis.groups.edit'
                : 'finances.analysis.groups.create',
            )}
          </Button>
        )
      }
    >
      {lists.length > 0 ? (
        lists.map(({ type, totals }) => {
          // The largest row, which can be "not grouped".
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
                {totals.map(({ id, name, total, share }) => (
                  <li
                    key={id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 text-sm"
                  >
                    <span
                      className={cn(
                        'truncate',
                        id === ungrouped && 'text-muted-foreground',
                      )}
                    >
                      {id === ungrouped
                        ? t('finances.analysis.groups.ungrouped')
                        : name || t('finances.analysis.groups.untitled')}
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
                        id === ungrouped
                          ? 'bg-muted-foreground/40'
                          : type === 'expense'
                            ? 'bg-viz-expense'
                            : 'bg-viz-income',
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
            hasGroups
              ? 'finances.analysis.groups.emptyRange'
              : 'finances.analysis.groups.hint',
          )}
        </p>
      )}
      {!isReadOnly && !hasPlus && (
        <PlusNote>{t('finances.analysis.groups.plusToEdit')}</PlusNote>
      )}
      {canEdit && (
        <CategoryGroupsEditor
          open={isEditing}
          setOpen={setIsEditing}
          types={types}
        />
      )}
    </Section>
  )
}
