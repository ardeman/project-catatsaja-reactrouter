import { Check, Pencil, Repeat, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { CategoryIcon } from '~/components/base/category-icon'
import { NumberInput } from '~/components/base/number-input'
import { Button } from '~/components/ui/button'
import { TFinanceCurrency, TFinanceForm } from '~/lib/types/finance'
import { today } from '~/lib/utils/finance'
import { dueRecurring, upcomingRecurring } from '~/lib/utils/recurring'

import { RecurringEditor } from './recurring-editor'

type TProperties = {
  book: TFinanceCurrency
  // A due recurring entry added (true) or skipped (false), on the day due.
  onDue: (id: string, date: string, isAdded: boolean) => void
}

// The book's recurring entries that are due, each added with one tap after
// checking its amount, or skipped for that month. When none is due, the
// next one. Shown to people who can write in the book.
export const Recurring = ({ book, onDue }: TProperties) => {
  const { t, i18n } = useTranslation()
  const headingId = useId()
  const { control } = useFormContext<TFinanceForm>()
  const recurring = useWatch({ control, name: 'recurring' }) ?? []
  const [isEditing, setIsEditing] = useState(false)
  const day = today()
  const due = dueRecurring(recurring, day)
  const upcoming = upcomingRecurring(recurring, day)
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }),
    [i18n.language],
  )
  const formatDate = (date: string) =>
    dateFormatter.format(new Date(`${date}T00:00:00Z`))
  const nameOf = (item: (typeof recurring)[number]) =>
    item.description || t(`finances.form.category.${item.category}.label`)

  return (
    <section
      aria-labelledby={headingId}
      className="glass-surface grid gap-2 rounded-xl border p-3"
    >
      <div className="flex items-center gap-2">
        <Repeat
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
        <h2
          id={headingId}
          className="text-sm font-semibold"
        >
          {t('finances.recurring.title')}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto size-8"
          aria-label={t('finances.recurring.edit')}
          title={t('finances.recurring.edit')}
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="size-4" />
        </Button>
      </div>
      {due.length > 0 ? (
        <ul className="grid gap-2">
          {due.map(({ recurring: item, date }) => {
            const index = recurring.findIndex(({ id }) => id === item.id)
            const name = nameOf(item)
            const amount = Number(item.amount)
            return (
              <li
                key={item.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 rounded-lg border p-2 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,10rem)_auto]"
              >
                <CategoryIcon
                  category={item.category}
                  chip
                />
                <span className="grid min-w-0">
                  <span className="truncate text-sm font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t('finances.recurring.dueOn', { date: formatDate(date) })}
                  </span>
                </span>
                <div className="col-span-2 flex items-center gap-1.5 [&_input]:h-8 [&_input]:text-sm">
                  <NumberInput
                    name={`recurring.${index}.amount`}
                    allowMath
                    fractionDigits={item.currency.maximumFractionDigits}
                    accessibleLabel={t('finances.recurring.amountOf', {
                      name,
                      // An attribute, not HTML: "Food & drinks" stays.
                      interpolation: { escapeValue: false },
                    })}
                    placeholder={
                      item.currency.code === book.code
                        ? '0'
                        : item.currency.code
                    }
                    className="min-w-0 flex-1 [&_input]:text-right [&_input]:tabular-nums"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8"
                    disabled={!(amount > 0)}
                    onClick={() => onDue(item.id, date, true)}
                  >
                    <Check className="size-3.5" />
                    {t('finances.recurring.add')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={t('finances.recurring.skip', { name })}
                    title={t('finances.recurring.skip', { name })}
                    onClick={() => onDue(item.id, date, false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        upcoming && (
          <p className="text-xs text-muted-foreground">
            {t('finances.recurring.next', {
              name: nameOf(upcoming.recurring),
              date: formatDate(upcoming.date),
            })}
          </p>
        )
      )}
      <RecurringEditor
        open={isEditing}
        setOpen={setIsEditing}
      />
    </section>
  )
}
