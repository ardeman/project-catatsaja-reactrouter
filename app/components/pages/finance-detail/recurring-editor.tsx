import { X } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { CategoryIcon } from '~/components/base/category-icon'
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
import { TFinanceForm } from '~/lib/types/finance'

type TProperties = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

const days = Array.from({ length: 31 }, (_, index) => index + 1)

// Changing a recurring entry's description, amount and day of the month,
// or stopping it. New ones are made from the entry form ("Repeat every
// month"). Changes go into the book's form as they are made, so they save
// like the rest of the book.
export const RecurringEditor = ({ open, setOpen }: TProperties) => {
  const { t } = useTranslation()
  const { control, getValues, setValue } = useFormContext<TFinanceForm>()
  // Rows are keyed by their own id (see `accounts.tsx`).
  const recurring = useWatch({ control, name: 'recurring' }) ?? []

  const update = (next: TFinanceForm['recurring']) =>
    setValue('recurring', next, { shouldDirty: true })

  const handleRemove = (id: string) =>
    update((getValues('recurring') ?? []).filter((item) => item.id !== id))

  const handleDay = (id: string, day: string) =>
    update(
      (getValues('recurring') ?? []).map((item) =>
        item.id === id ? { ...item, day: Number(day) } : item,
      ),
    )

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      title={t('finances.recurring.edit')}
      description={t('finances.recurring.editHint')}
    >
      {recurring.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('finances.recurring.empty')}
        </p>
      ) : (
        <ul className="grid gap-1.5">
          {recurring.map((item, index) => {
            const name =
              item.description ||
              t(`finances.form.category.${item.category}.label`)
            return (
              <li
                key={item.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 rounded-lg border p-2 [&_input]:h-8 [&_input]:text-sm"
              >
                <CategoryIcon category={item.category} />
                <Input<TFinanceForm>
                  name={`recurring.${index}.description`}
                  label={t('finances.form.description.label')}
                  labelClassName="sr-only"
                  // The hidden label must not push the input down.
                  className="[&>:not([hidden])~:not([hidden])]:mt-0"
                  placeholder={t(
                    `finances.form.category.${item.category}.label`,
                  )}
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={t('finances.recurring.remove', { name })}
                  title={t('finances.recurring.remove', { name })}
                  onClick={() => handleRemove(item.id)}
                >
                  <X className="size-4" />
                </Button>
                <div className="col-span-2 col-start-2 grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-1.5">
                  <NumberInput
                    name={`recurring.${index}.amount`}
                    allowMath
                    fractionDigits={item.currency.maximumFractionDigits}
                    accessibleLabel={t('finances.recurring.amountOf', {
                      name,
                      // An attribute, not HTML: "Food & drinks" stays.
                      interpolation: { escapeValue: false },
                    })}
                    placeholder={item.currency.code}
                    className="[&_input]:text-right [&_input]:tabular-nums"
                  />
                  <Select
                    value={String(item.day)}
                    onValueChange={(day) => handleDay(item.id, day)}
                  >
                    <SelectTrigger
                      className="h-8"
                      aria-label={t('finances.recurring.dayOf', {
                        name,
                        interpolation: { escapeValue: false },
                      })}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (
                        <SelectItem
                          key={day}
                          value={String(day)}
                        >
                          {t('finances.recurring.day', { day })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
