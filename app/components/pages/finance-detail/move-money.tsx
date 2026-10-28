import { zodResolver } from '@hookform/resolvers/zod'
import { Dispatch, SetStateAction, useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { Modal } from '~/components/base/modal'
import { NumberInput } from '~/components/base/number-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/base/select'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { useMoney } from '~/lib/hooks/use-money'
import {
  TFinanceAccount,
  TFinanceCurrency,
  TTransfer,
  TTransferForm,
} from '~/lib/types/finance'
import { transferSchema } from '~/lib/validations/finance'

type TProperties = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  accounts: TFinanceAccount[]
  book: TFinanceCurrency
  onMove: (transfer: TTransfer) => void
}

// Moves money between two of a book's accounts (cash taken out, a top-up):
// one balance goes down and the other up, and the book's totals stay as
// they are.
export const MoveMoney = (properties: TProperties) => {
  const { open, setOpen, accounts, book, onMove } = properties
  const { t } = useTranslation(['common', 'zod'])
  const money = useMoney()

  const defaults = (): TTransferForm => ({
    from: accounts[0]?.id ?? '',
    to: accounts[1]?.id ?? '',
    amount: '',
  })
  const formMethods = useForm<TTransferForm, unknown, TTransfer>({
    resolver: zodResolver(transferSchema(t)),
    defaultValues: defaults(),
  })
  const { control, handleSubmit, reset } = formMethods

  useEffect(() => {
    if (open) reset(defaults())
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when opened: the accounts change as their balances are typed
  }, [open, reset])

  const onSubmit = handleSubmit((transfer) => {
    onMove(transfer)
    setOpen(false)
  })

  const accountSelect = (name: 'from' | 'to') => (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t(`finances.accounts.move.${name}`)}</FormLabel>
          <Select
            value={field.value}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {accounts.map((account, index) => (
                <SelectItem
                  key={account.id}
                  value={account.id}
                >
                  {account.name.trim() ||
                    t('finances.accounts.move.unnamed', { number: index + 1 })}
                  <span className="text-muted-foreground tabular-nums">
                    {money(Number(account.balance) || 0, book)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      title={t('finances.accounts.move.title')}
      description={t('finances.accounts.move.description')}
    >
      <FormProvider {...formMethods}>
        <form
          onSubmit={(event) => {
            // Don't submit the book form underneath.
            event.stopPropagation()
            void onSubmit(event)
          }}
          className="grid gap-4"
        >
          {accountSelect('from')}
          {accountSelect('to')}
          <NumberInput
            name="amount"
            label={t('finances.accounts.move.amount')}
            allowMath
            fractionDigits={book.maximumFractionDigits}
            placeholder="0"
            required
            className="[&_input]:tabular-nums"
          />
          <div className="flex justify-end gap-2 pt-2">
            <div className="hidden sm:block">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t('form.cancel')}
              </Button>
            </div>
            <Button type="submit">{t('finances.accounts.move.submit')}</Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  )
}
