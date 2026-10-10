import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/base/input'
import { NumberInput } from '~/components/base/number-input'
import { Button } from '~/components/ui/button'
import { useMoney } from '~/lib/hooks/use-money'
import { TFinanceCurrency, TFinanceForm } from '~/lib/types/finance'
import { sumAccounts } from '~/lib/utils/finance'
import { cn } from '~/lib/utils/shadcn'

type TProperties = {
  book: TFinanceCurrency
  balance: number
  isReadOnly: boolean
}

// What the person actually holds, checked against the book's balance.
export const Accounts = ({ book, balance, isReadOnly }: TProperties) => {
  const { t } = useTranslation()
  const money = useMoney()
  const { control } = useFormContext<TFinanceForm>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'accounts',
    keyName: 'key',
  })
  const [addedId, setAddedId] = useState<string>()
  const accounts = useWatch({ control, name: 'accounts' })
  const actual = sumAccounts(accounts)
  // Rounded to the book's smallest unit, so float noise reads as a match.
  const unit = 10 ** book.maximumFractionDigits
  const difference = Math.round((actual - balance) * unit) / unit

  if (isReadOnly && fields.length === 0) return null

  return (
    <section className="glass-surface grid gap-3 rounded-xl border p-4">
      <div className="grid gap-0.5">
        <h2 className="text-sm font-medium">{t('finances.accounts.title')}</h2>
        <p className="text-xs text-muted-foreground">
          {t('finances.accounts.hint')}
        </p>
      </div>

      {fields.length > 0 && (
        <ul className="grid gap-2">
          {fields.map((field, index) => (
            <li
              key={field.key}
              className="motion-enter grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2"
            >
              <Input<TFinanceForm>
                name={`accounts.${index}.name`}
                label={t('finances.accounts.name.label')}
                labelClassName="sr-only"
                placeholder={t('finances.accounts.name.placeholder')}
                readOnly={isReadOnly}
                autoComplete="off"
                autoFocus={field.id === addedId} // eslint-disable-line jsx-a11y/no-autofocus -- the row just added
              />
              <NumberInput
                name={`accounts.${index}.balance`}
                accessibleLabel={t('finances.accounts.balance.label')}
                placeholder="0"
                disabled={isReadOnly}
              />
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t('finances.accounts.remove')}
                  title={t('finances.accounts.remove')}
                  onClick={() => remove(index)}
                >
                  <X className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!isReadOnly && (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={() => {
            const id = crypto.randomUUID()
            setAddedId(id)
            // The balance field holds typed text until it is saved.
            append({ id, name: '', balance: '' as unknown as number })
          }}
        >
          <Plus className="size-4" />
          {t('finances.accounts.add')}
        </Button>
      )}

      {fields.length > 0 && (
        <div className="grid gap-1 border-t pt-3 text-sm">
          <dl className="contents">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <dt className="text-muted-foreground">
                {t('finances.accounts.total')}
              </dt>
              <dd className="font-medium tabular-nums">
                {money(actual, book)}
              </dd>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <dt className="text-muted-foreground">
                {t('finances.accounts.difference')}
              </dt>
              <dd
                className={cn(
                  'font-semibold tabular-nums',
                  difference === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-destructive',
                )}
              >
                {money(difference, book, true)}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            {difference === 0
              ? t('finances.accounts.match')
              : t(
                  difference > 0
                    ? 'finances.accounts.more'
                    : 'finances.accounts.less',
                  { amount: money(difference, book) },
                )}
          </p>
        </div>
      )}
    </section>
  )
}
