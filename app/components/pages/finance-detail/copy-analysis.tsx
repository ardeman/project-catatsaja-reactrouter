import { Copy } from 'lucide-react'
import { type ReactNode, useId, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Modal } from '~/components/base/modal'
import { PlusNote } from '~/components/base/plus-note'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/base/select'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { toast } from '~/lib/hooks/use-toast'
import { TFinanceForm, TFinanceResponse } from '~/lib/types/finance'
import { TCurrency } from '~/lib/types/settings'
import {
  copyableFrom,
  copySetup,
  setupSize,
  TCopyOnly,
} from '~/lib/utils/copy-analysis'

import { budgetLabelKey } from './budgets-editor'

type TProperties = {
  // The person's other books.
  books: TFinanceResponse[]
  currencies: TCurrency[]
  isReadOnly: boolean
  // Whether the book's Plus features can be changed (`useBookPlan`).
  hasPlus: boolean
}

type TSelection = {
  categoryGroups: Set<string>
  budgets: Set<string>
  keywords: Set<string>
  goals: Set<string>
  payday: boolean
}

// Units of `to` for 1 unit of `from`, from the person's own rates (each the
// value of 1 unit in their default currency); undefined when one is missing.
const knownRate = (from: string, to: string, currencies: TCurrency[]) => {
  if (from === to) return 1
  const rateOf = (code: string) =>
    currencies.find((currency) => currency.code === code)?.rate
  const fromRate = rateOf(from)
  const toRate = rateOf(to)
  return fromRate && toRate
    ? Number((fromRate / toRate).toPrecision(8))
    : undefined
}

const allSelected = (book: TFinanceResponse): TSelection => {
  const items = copyableFrom(book)
  return {
    categoryGroups: new Set(items.categoryGroups.map((group) => group.id)),
    budgets: new Set(items.budgets.map((budget) => budget.id)),
    keywords: new Set(items.keywords.map((keyword) => keyword.id)),
    goals: new Set(items.goals.map((goal) => goal.id)),
    payday: Boolean(items.payday),
  }
}

const selectionSize = (selection: TSelection) =>
  selection.categoryGroups.size +
  selection.budgets.size +
  selection.keywords.size +
  selection.goals.size +
  (selection.payday ? 1 : 0)

const toOnly = (selection: TSelection): TCopyOnly => ({
  ...(selection.categoryGroups.size > 0 && {
    categoryGroups: selection.categoryGroups,
  }),
  ...(selection.budgets.size > 0 && { budgets: selection.budgets }),
  ...(selection.keywords.size > 0 && { keywords: selection.keywords }),
  ...(selection.goals.size > 0 && { goals: selection.goals }),
  ...(selection.payday && { payday: true }),
})

// A labelled checkbox row for one thing to copy.
const ItemRow = ({
  id,
  isChecked,
  onCheckedChange,
  children,
}: {
  id: string
  isChecked: boolean
  onCheckedChange: (isChecked: boolean) => void
  children: ReactNode
}) => (
  <label
    htmlFor={id}
    className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1.5 hover:bg-muted/50"
  >
    <Checkbox
      id={id}
      checked={isChecked}
      onCheckedChange={(value) => onCheckedChange(value === true)}
      className="mt-0.5"
    />
    <span className="min-w-0 text-sm leading-snug">{children}</span>
  </label>
)

// A section of items under a part title, with a select-all for that part.
const Part = ({
  title,
  allIds,
  selected,
  onChange,
  children,
}: {
  title: string
  allIds: string[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
  children: ReactNode
}) => {
  const id = useId()
  if (allIds.length === 0) return
  const allOn = allIds.every((item) => selected.has(item))
  const someOn = allIds.some((item) => selected.has(item))
  return (
    <div className="grid gap-0.5">
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-2 px-1 py-1"
      >
        <Checkbox
          id={id}
          checked={allOn ? true : someOn ? 'indeterminate' : false}
          onCheckedChange={(value) =>
            onChange(value === true ? new Set(allIds) : new Set())
          }
        />
        <span className="text-sm font-medium">{title}</span>
      </label>
      <div className="ml-2.5 grid gap-0.5 border-l border-border/60 pl-3">
        {children}
      </div>
    </div>
  )
}

const toggleId = (ids: Set<string>, id: string, shouldSelect: boolean) => {
  const next = new Set(ids)
  if (shouldSelect) next.add(id)
  else next.delete(id)
  return next
}

// Copies another book's groups, budgets, keywords, savings goals and payday
// into this one (a Plus feature, for writers), adding only what it lacks.
// The person picks which of those to bring. The copy goes into the book's
// form, so it saves and undoes like any edit. Free accounts see the button
// turned off, with what Plus is.
export const CopyAnalysis = ({
  books,
  currencies,
  isReadOnly,
  hasPlus,
}: TProperties) => {
  const { t } = useTranslation()
  const { getValues, setValue } = useFormContext<TFinanceForm>()
  const [isOpen, setIsOpen] = useState(false)
  const [sourceId, setSourceId] = useState<string>()
  const [selection, setSelection] = useState<TSelection>({
    categoryGroups: new Set(),
    budgets: new Set(),
    keywords: new Set(),
    goals: new Set(),
    payday: false,
  })
  const labelId = useId()
  const whatId = useId()
  const paydayId = useId()

  const sources = books.filter((book) => setupSize(book) > 0)
  if (isReadOnly || sources.length === 0) return

  const source = sources.find((book) => book.id === sourceId) ?? sources[0]
  const items = copyableFrom(source)
  const currency = getValues('currency')
  const rate = knownRate(source.currency.code, currency.code, currencies)
  const selectedBudgets = items.budgets.filter((budget) =>
    selection.budgets.has(budget.id),
  )
  const selectedGoals = items.goals.filter((goal) =>
    selection.goals.has(goal.id),
  )
  const hasAmounts =
    selectedBudgets.some((budget) => budget.limit !== null) ||
    selectedGoals.some((goal) => goal.amount !== null)
  const hasNothingChosen = selectionSize(selection) === 0

  // Opening, or picking another book, starts with everything of that book ticked.
  const openWith = (book: TFinanceResponse) => {
    setSourceId(book.id)
    setSelection(allSelected(book))
    setIsOpen(true)
  }

  const handleSourceChange = (id: string) => {
    const book = sources.find((item) => item.id === id)
    if (!book) return
    setSourceId(id)
    setSelection(allSelected(book))
  }

  const handleCopy = () => {
    if (hasNothingChosen) {
      toast({ description: t('finances.analysis.copy.noneChosen') })
      return
    }
    const { added, ...setup } = copySetup(getValues(), source, {
      rate,
      fractionDigits: currency.maximumFractionDigits,
      newId: () => crypto.randomUUID(),
      only: toOnly(selection),
    })
    if (added > 0)
      for (const field of [
        'categoryGroups',
        'budgets',
        'keywords',
        'goals',
        'payday',
      ] as const)
        setValue(field, setup[field], { shouldDirty: true })
    setIsOpen(false)
    toast({
      description: t(
        added > 0
          ? 'finances.analysis.copy.done'
          : 'finances.analysis.copy.nothing',
        { count: added },
      ),
    })
  }

  return (
    <>
      <div className="grid gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-start"
          disabled={!hasPlus}
          onClick={() => openWith(source)}
        >
          <Copy className="size-3.5" />
          {t('finances.analysis.copy.open')}
        </Button>
        {!hasPlus && <PlusNote>{t('finances.analysis.copy.plus')}</PlusNote>}
      </div>
      <Modal
        open={isOpen}
        setOpen={setIsOpen}
        title={t('finances.analysis.copy.title')}
        description={t('finances.analysis.copy.description')}
        handleConfirm={handleCopy}
        confirmLabel={t('finances.analysis.copy.confirm')}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <span
              id={labelId}
              className="text-sm font-medium"
            >
              {t('finances.analysis.copy.from')}
            </span>
            <Select
              value={source.id}
              onValueChange={handleSourceChange}
            >
              <SelectTrigger aria-labelledby={labelId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sources.map((book) => (
                  <SelectItem
                    key={book.id}
                    value={book.id}
                  >
                    {book.title.trim() || t('finances.untitled')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <span
              id={whatId}
              className="text-sm font-medium"
            >
              {t('finances.analysis.copy.what')}
            </span>
            <div
              role="group"
              aria-labelledby={whatId}
              className="grid gap-3"
            >
              <Part
                title={t('finances.analysis.groups.title')}
                allIds={items.categoryGroups.map((group) => group.id)}
                selected={selection.categoryGroups}
                onChange={(categoryGroups) =>
                  setSelection((current) => ({ ...current, categoryGroups }))
                }
              >
                {items.categoryGroups.map((group) => (
                  <ItemRow
                    key={group.id}
                    id={`${whatId}-group-${group.id}`}
                    isChecked={selection.categoryGroups.has(group.id)}
                    onCheckedChange={(shouldSelect) =>
                      setSelection((current) => ({
                        ...current,
                        categoryGroups: toggleId(
                          current.categoryGroups,
                          group.id,
                          shouldSelect,
                        ),
                      }))
                    }
                  >
                    <span className="font-medium">
                      {group.name.trim() ||
                        t('finances.analysis.groups.untitled')}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {group.categories
                        .map((category) =>
                          t(`finances.form.category.${category}.label`),
                        )
                        .join(', ')}
                    </span>
                  </ItemRow>
                ))}
              </Part>
              <Part
                title={t('finances.analysis.budgets.title')}
                allIds={items.budgets.map((budget) => budget.id)}
                selected={selection.budgets}
                onChange={(budgets) =>
                  setSelection((current) => ({ ...current, budgets }))
                }
              >
                {items.budgets.map((budget) => (
                  <ItemRow
                    key={budget.id}
                    id={`${whatId}-budget-${budget.id}`}
                    isChecked={selection.budgets.has(budget.id)}
                    onCheckedChange={(shouldSelect) =>
                      setSelection((current) => ({
                        ...current,
                        budgets: toggleId(
                          current.budgets,
                          budget.id,
                          shouldSelect,
                        ),
                      }))
                    }
                  >
                    {t(budgetLabelKey(budget.category))}
                  </ItemRow>
                ))}
              </Part>
              <Part
                title={t('finances.analysis.keywords.title')}
                allIds={items.keywords.map((keyword) => keyword.id)}
                selected={selection.keywords}
                onChange={(keywords) =>
                  setSelection((current) => ({ ...current, keywords }))
                }
              >
                {items.keywords.map((keyword) => (
                  <ItemRow
                    key={keyword.id}
                    id={`${whatId}-keyword-${keyword.id}`}
                    isChecked={selection.keywords.has(keyword.id)}
                    onCheckedChange={(shouldSelect) =>
                      setSelection((current) => ({
                        ...current,
                        keywords: toggleId(
                          current.keywords,
                          keyword.id,
                          shouldSelect,
                        ),
                      }))
                    }
                  >
                    {keyword.text.trim()}
                  </ItemRow>
                ))}
              </Part>
              <Part
                title={t('finances.analysis.goals.title')}
                allIds={items.goals.map((goal) => goal.id)}
                selected={selection.goals}
                onChange={(goals) =>
                  setSelection((current) => ({ ...current, goals }))
                }
              >
                {items.goals.map((goal) => (
                  <ItemRow
                    key={goal.id}
                    id={`${whatId}-goal-${goal.id}`}
                    isChecked={selection.goals.has(goal.id)}
                    onCheckedChange={(shouldSelect) =>
                      setSelection((current) => ({
                        ...current,
                        goals: toggleId(current.goals, goal.id, shouldSelect),
                      }))
                    }
                  >
                    {goal.name.trim()}
                  </ItemRow>
                ))}
              </Part>
              {items.payday ? (
                <label
                  htmlFor={paydayId}
                  className="flex cursor-pointer items-center gap-2 px-1 py-1"
                >
                  <Checkbox
                    id={paydayId}
                    checked={selection.payday}
                    onCheckedChange={(value) =>
                      setSelection((current) => ({
                        ...current,
                        payday: value === true,
                      }))
                    }
                  />
                  <span className="text-sm">
                    <span className="font-medium">
                      {t('finances.analysis.goals.payday')}
                    </span>
                    <span className="text-muted-foreground">
                      {' · '}
                      {t('finances.analysis.goals.day', { day: items.payday })}
                    </span>
                  </span>
                </label>
              ) : null}
            </div>
          </div>
          {hasAmounts && source.currency.code !== currency.code && (
            <p className="text-xs text-muted-foreground">
              {t(
                rate === undefined
                  ? 'finances.analysis.copy.noRate'
                  : 'finances.analysis.copy.converted',
                { from: source.currency.code, to: currency.code },
              )}
            </p>
          )}
        </div>
      </Modal>
    </>
  )
}
