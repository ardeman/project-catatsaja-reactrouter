import { Plus, Wallet, X } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { CategoryIcon } from '~/components/base/category-icon'
import { Modal } from '~/components/base/modal'
import { NumberInput } from '~/components/base/number-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/base/select'
import { Button } from '~/components/ui/button'
import { financeCategories } from '~/lib/constants/finance'
import { TFinanceCurrency, TFinanceForm } from '~/lib/types/finance'
import { wholeBook } from '~/lib/utils/budgets'

type TProperties = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  book: TFinanceCurrency
}

// The whole book first, then the expense categories.
const budgetCategories = [
  wholeBook,
  ...financeCategories
    .filter((category) => category.type === 'expense')
    .map(({ key }) => key),
]

// A budget's icon: a category's, or a wallet for the whole book.
export const BudgetIcon = ({ category }: { category: string }) =>
  category === wholeBook ? (
    <Wallet
      aria-hidden="true"
      className="size-4 shrink-0 text-muted-foreground"
    />
  ) : (
    <CategoryIcon category={category} />
  )

// The translation key of a budget's name.
export const budgetLabelKey = (category: string) =>
  category === wholeBook
    ? 'finances.analysis.budgets.wholeBook'
    : `finances.form.category.${category}.label`

// Choosing a monthly limit for all of the book's spending and for expense
// categories, one budget per category. Changes go into the book's form as they are made, so they save
// like the rest of the book.
export const BudgetsEditor = ({ open, setOpen, book }: TProperties) => {
  const { t } = useTranslation()
  const { control, getValues, setValue } = useFormContext<TFinanceForm>()
  // Rows are keyed by their own id (see `accounts.tsx`).
  const budgets = useWatch({ control, name: 'budgets' }) ?? []
  const used = new Set(budgets.map((budget) => budget.category))
  const unused = budgetCategories.filter((key) => !used.has(key))

  const update = (next: TFinanceForm['budgets']) =>
    setValue('budgets', next, { shouldDirty: true })

  const handleAdd = () => {
    const [first] = unused
    if (!first) return
    update([
      ...(getValues('budgets') ?? []),
      { id: crypto.randomUUID(), category: first, limit: null },
    ])
  }

  const handleRemove = (id: string) =>
    update((getValues('budgets') ?? []).filter((budget) => budget.id !== id))

  const handlePeriod = (id: string, period: string) =>
    update(
      (getValues('budgets') ?? []).map((budget) =>
        budget.id === id
          ? { ...budget, period: period === 'book' ? 'book' : 'month' }
          : budget,
      ),
    )

  const handleCategory = (id: string, category: string) =>
    update(
      (getValues('budgets') ?? []).map((budget) =>
        budget.id === id ? { ...budget, category } : budget,
      ),
    )

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      title={t('finances.analysis.budgets.edit')}
      description={t('finances.analysis.budgets.editHint')}
    >
      <div className="grid gap-1.5">
        {budgets.length > 0 && (
          <ul className="grid gap-1.5">
            {budgets.map((budget, index) => (
              <li
                key={budget.id}
                className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_auto] items-start gap-1.5 rounded-lg border p-2 [&_input]:h-8 [&_input]:text-sm"
              >
                <Select
                  value={budget.category}
                  onValueChange={(category) =>
                    handleCategory(budget.id, category)
                  }
                >
                  <SelectTrigger
                    className="h-8"
                    aria-label={t('finances.analysis.budgets.category')}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetCategories
                      .filter(
                        (key) => key === budget.category || !used.has(key),
                      )
                      .map((key) => (
                        <SelectItem
                          key={key}
                          value={key}
                        >
                          <span className="flex items-center gap-2">
                            <BudgetIcon category={key} />
                            {t(budgetLabelKey(key))}
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <NumberInput
                  name={`budgets.${index}.limit`}
                  allowMath
                  fractionDigits={book.maximumFractionDigits}
                  accessibleLabel={t('finances.analysis.budgets.limitOf', {
                    category: t(budgetLabelKey(budget.category)),
                    // An attribute, not HTML: "Food & drinks" stays.
                    interpolation: { escapeValue: false },
                  })}
                  placeholder="0"
                  className="[&_input]:text-right [&_input]:tabular-nums"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={t('finances.analysis.budgets.remove')}
                  title={t('finances.analysis.budgets.remove')}
                  onClick={() => handleRemove(budget.id)}
                >
                  <X className="size-4" />
                </Button>
                <Select
                  value={budget.period ?? 'month'}
                  onValueChange={(period) => handlePeriod(budget.id, period)}
                >
                  <SelectTrigger
                    className="h-8"
                    aria-label={t('finances.analysis.budgets.period.label')}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['month', 'book'] as const).map((period) => (
                      <SelectItem
                        key={period}
                        value={period}
                      >
                        {t(`finances.analysis.budgets.period.${period}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-start"
          disabled={unused.length === 0}
          onClick={handleAdd}
        >
          <Plus className="size-3.5" />
          {t('finances.analysis.budgets.add')}
        </Button>
      </div>
    </Modal>
  )
}
