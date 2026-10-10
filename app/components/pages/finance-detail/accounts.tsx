import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/base/input'
import { NumberInput } from '~/components/base/number-input'
import { Button } from '~/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { useMoney } from '~/lib/hooks/use-money'
import { TFinanceCurrency, TFinanceForm } from '~/lib/types/finance'
import { sumAccounts } from '~/lib/utils/finance'
import { cn } from '~/lib/utils/shadcn'

type TProperties = {
  book: TFinanceCurrency
  balance: number
  isReadOnly: boolean
}

// What the person actually holds, checked against the book's balance. Shown
// inside the summary card, below the book's totals.
export const Accounts = ({ book, balance, isReadOnly }: TProperties) => {
  const { t } = useTranslation()
  const money = useMoney()
  const { control, getValues, setValue } = useFormContext<TFinanceForm>()
  // Rows are keyed by their own id, not by react-hook-form's field array
  // keys: those are regenerated whenever the saved book comes back, which
  // remounted the inputs while typing.
  const accounts = useWatch({ control, name: 'accounts' }) ?? []
  const [addedId, setAddedId] = useState<string>()
  const [isDifferenceHintOpen, setIsDifferenceHintOpen] = useState(false)
  const actual = sumAccounts(accounts)
  // Rounded to the book's smallest unit, so float noise reads as a match.
  const unit = 10 ** book.maximumFractionDigits
  const difference = Math.round((actual - balance) * unit) / unit

  if (isReadOnly && accounts.length === 0) return null

  const handleAdd = () => {
    const id = crypto.randomUUID()
    setAddedId(id)
    setValue(
      'accounts',
      [...(getValues('accounts') ?? []), { id, name: '', balance: null }],
      { shouldDirty: true },
    )
  }

  const handleRemove = (id: string) => {
    setValue(
      'accounts',
      (getValues('accounts') ?? []).filter((account) => account.id !== id),
      { shouldDirty: true },
    )
  }

  return (
    <TooltipProvider>
      <div className="grid gap-2 border-t pt-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs text-muted-foreground">
            {t('finances.accounts.title')}
          </h2>
          {!isReadOnly && (
            <Tooltip
              // Explains the section until the first account is added.
              open={accounts.length > 0 ? false : undefined}
            >
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-my-1 -mr-2 gap-1"
                  onClick={handleAdd}
                >
                  <Plus className="size-3.5" />
                  {t('finances.accounts.add')}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                {t('finances.accounts.hint')}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {accounts.length > 0 && (
          <>
            <ul className="grid gap-1.5">
              {accounts.map((account, index) => (
                <li
                  key={account.id}
                  className="motion-enter grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_auto] items-center gap-1.5 [&_input]:h-8 [&_input]:text-sm"
                >
                  <Input<TFinanceForm>
                    name={`accounts.${index}.name`}
                    label={t('finances.accounts.name.label')}
                    labelClassName="sr-only"
                    // The hidden label must not push the input down.
                    className="[&>:not([hidden])~:not([hidden])]:mt-0"
                    placeholder={t('finances.accounts.name.placeholder')}
                    readOnly={isReadOnly}
                    autoComplete="off"
                    autoFocus={account.id === addedId} // eslint-disable-line jsx-a11y/no-autofocus -- the row just added
                  />
                  <NumberInput
                    name={`accounts.${index}.balance`}
                    accessibleLabel={t('finances.accounts.balance.label')}
                    placeholder="0"
                    disabled={isReadOnly}
                    className="[&_input]:text-right [&_input]:tabular-nums"
                  />
                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={t('finances.accounts.remove')}
                      title={t('finances.accounts.remove')}
                      onClick={() => handleRemove(account.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>

            {/* The same columns as the rows above (without the remove
              button), so totals line up under the balances. */}
            <dl
              className={cn(
                'grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-baseline gap-x-1.5 gap-y-1',
                !isReadOnly && 'pr-9.5',
              )}
            >
              <dt className="text-xs text-muted-foreground">
                {t('finances.accounts.total')}
              </dt>
              <dd className="pr-[calc(--spacing(3)+1px)] text-right text-sm font-medium wrap-break-word tabular-nums">
                {money(actual, book)}
              </dd>
              <dt className="text-xs text-muted-foreground">
                {t('finances.accounts.difference')}
              </dt>
              <dd
                className={cn(
                  'pr-[calc(--spacing(3)+1px)] text-right text-sm font-medium wrap-break-word tabular-nums',
                  difference === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-destructive',
                )}
              >
                <Tooltip
                  open={isDifferenceHintOpen}
                  onOpenChange={setIsDifferenceHintOpen}
                >
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="cursor-help text-right underline decoration-dotted underline-offset-4"
                      // Opens on tap as well as on hover and focus.
                      onClick={(event) => {
                        event.preventDefault()
                        setIsDifferenceHintOpen(true)
                      }}
                    >
                      {money(difference, book, true)}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64">
                    {difference === 0
                      ? t('finances.accounts.match')
                      : t(
                          difference > 0
                            ? 'finances.accounts.more'
                            : 'finances.accounts.less',
                        )}
                  </TooltipContent>
                </Tooltip>
              </dd>
            </dl>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
