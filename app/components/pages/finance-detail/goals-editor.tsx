import { Plus, X } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Checkbox } from '~/components/base/checkbox'
import { Input } from '~/components/base/input'
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
import {
  TFinanceCurrency,
  TFinanceEntry,
  TFinanceForm,
} from '~/lib/types/finance'
import { addMonths, suggestPayday } from '~/lib/utils/savings-goals'

type TProperties = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  book: TFinanceCurrency
  entries: TFinanceEntry[]
  // This month, as YYYY-MM.
  month: string
}

const days = Array.from({ length: 31 }, (_, index) => index + 1)

// Choosing the payday and the goals to save for. Changes go into the
// book's form as they are made, so they save like the rest of the book.
export const GoalsEditor = ({
  open,
  setOpen,
  book,
  entries,
  month,
}: TProperties) => {
  const { t, i18n } = useTranslation()
  const { control, getValues, setValue } = useFormContext<TFinanceForm>()
  // Rows are keyed by their own id (see `accounts.tsx`).
  const goals = useWatch({ control, name: 'goals' }) ?? []
  const payday = useWatch({ control, name: 'payday' }) ?? null
  const [addedId, setAddedId] = useState<string>()
  const suggestion = payday === null ? suggestPayday(entries) : undefined

  // Five years ahead, and any earlier month a goal is still due in.
  const monthName = new Intl.DateTimeFormat(i18n.language, {
    month: 'long',
    year: 'numeric',
  })
  const months = Array.from({ length: 60 }, (_, index) =>
    addMonths(month, index),
  )
  const monthsFor = (due: string) =>
    due && !months.includes(due) ? [due, ...months] : months

  const update = (next: TFinanceForm['goals']) =>
    setValue('goals', next, { shouldDirty: true })

  const handleAdd = () => {
    const id = crypto.randomUUID()
    setAddedId(id)
    update([
      ...(getValues('goals') ?? []),
      {
        id,
        name: '',
        amount: null,
        due: addMonths(month, 6),
        done: false,
        spent: null,
      },
    ])
  }

  const handleRemove = (id: string) =>
    update((getValues('goals') ?? []).filter((goal) => goal.id !== id))

  const handleDue = (id: string, due: string) =>
    update(
      (getValues('goals') ?? []).map((goal) =>
        goal.id === id ? { ...goal, due } : goal,
      ),
    )

  const handlePayday = (day: number | null) =>
    setValue('payday', day, { shouldDirty: true })

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      title={t('finances.analysis.goals.edit')}
      description={t('finances.analysis.goals.editHint')}
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            id="goals-payday"
            className="text-sm"
          >
            {t('finances.analysis.goals.payday')}
          </span>
          <Select
            value={payday === null ? 'none' : String(payday)}
            onValueChange={(value) =>
              handlePayday(value === 'none' ? null : Number(value))
            }
          >
            <SelectTrigger
              className="h-8 w-36"
              aria-labelledby="goals-payday"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {t('finances.analysis.goals.paydayNone')}
              </SelectItem>
              {days.map((day) => (
                <SelectItem
                  key={day}
                  value={String(day)}
                >
                  {t('finances.analysis.goals.day', { day })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {suggestion && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto px-0"
              onClick={() => handlePayday(suggestion.day)}
            >
              {t('finances.analysis.goals.suggest', {
                day: suggestion.day,
                source:
                  suggestion.description ||
                  t(`finances.form.category.${suggestion.category}.label`),
              })}
            </Button>
          )}
        </div>

        {goals.length > 0 && (
          <ul className="grid gap-2">
            {goals.map((goal, index) => (
              <li
                key={goal.id}
                className="grid gap-1.5 rounded-lg border p-2 [&_input]:h-8 [&_input]:text-sm"
              >
                <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_auto] items-start gap-1.5">
                  <Input<TFinanceForm>
                    name={`goals.${index}.name`}
                    label={t('finances.analysis.goals.name')}
                    labelClassName="sr-only"
                    // The hidden label must not push the input down.
                    className="[&>:not([hidden])~:not([hidden])]:mt-0"
                    placeholder={t('finances.analysis.goals.namePlaceholder')}
                    autoComplete="off"
                    autoFocus={goal.id === addedId} // eslint-disable-line jsx-a11y/no-autofocus -- the row just added
                  />
                  <NumberInput
                    name={`goals.${index}.amount`}
                    allowMath
                    fractionDigits={book.maximumFractionDigits}
                    accessibleLabel={t('finances.analysis.goals.amount')}
                    placeholder="0"
                    className="[&_input]:text-right [&_input]:tabular-nums"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={t('finances.analysis.goals.remove')}
                    title={t('finances.analysis.goals.remove')}
                    onClick={() => handleRemove(goal.id)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_auto] items-start gap-1.5">
                  <Select
                    value={goal.due}
                    onValueChange={(due) => handleDue(goal.id, due)}
                  >
                    <SelectTrigger
                      className="h-8"
                      aria-label={t('finances.analysis.goals.due')}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthsFor(goal.due).map((due) => (
                        <SelectItem
                          key={due}
                          value={due}
                        >
                          {monthName.format(new Date(`${due}-01T00:00:00`))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {goal.done ? (
                    <NumberInput
                      name={`goals.${index}.spent`}
                      allowMath
                      fractionDigits={book.maximumFractionDigits}
                      accessibleLabel={t('finances.analysis.goals.spent')}
                      placeholder={t('finances.analysis.goals.spent')}
                      className="[&_input]:text-right [&_input]:tabular-nums"
                    />
                  ) : (
                    <span />
                  )}
                  <Checkbox<TFinanceForm>
                    name={`goals.${index}.done`}
                    label={t('finances.analysis.goals.done')}
                    className="pr-1"
                    containerClassName="h-8"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-start"
          onClick={handleAdd}
        >
          <Plus className="size-3.5" />
          {t('finances.analysis.goals.add')}
        </Button>
      </div>
    </Modal>
  )
}
