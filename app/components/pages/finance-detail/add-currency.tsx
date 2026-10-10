import { zodResolver } from '@hookform/resolvers/zod'
import { Dispatch, SetStateAction, useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { Input } from '~/components/base/input'
import { Modal } from '~/components/base/modal'
import { NumberInput } from '~/components/base/number-input'
import { useCreateCurrency } from '~/lib/hooks/use-create-currency'
import { useUserData } from '~/lib/hooks/use-get-user'
import {
  TCreateCurrencyRequest,
  TCurrency,
  TCurrencyForm,
} from '~/lib/types/settings'
import { getDefaultCurrencyFormat } from '~/lib/utils/parser'
import { currencySchema } from '~/lib/validations/settings'

type TProperties = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  currencies: TCurrency[]
  onAdded: (currency: TCurrency) => void
}

// Adds a currency to the person's settings without leaving the book or entry.
// Same rules as the settings page: the first currency is the default.
export const AddCurrency = (properties: TProperties) => {
  const { open, setOpen, currencies, onAdded } = properties
  const { t } = useTranslation(['common', 'zod'])
  const { data: userData } = useUserData()
  const { mutate, isPending } = useCreateCurrency()
  const minimumDecimals =
    userData?.currencyFormat?.minimumFractionDigits ??
    getDefaultCurrencyFormat().minimumFractionDigits
  const isFirst = currencies.length === 0
  const defaultCurrency = currencies.find((currency) => currency.isDefault)

  const formMethods = useForm<TCurrencyForm, unknown, TCreateCurrencyRequest>({
    resolver: zodResolver(currencySchema(t, minimumDecimals)),
    defaultValues: {
      code: '',
      symbol: '',
      maximumFractionDigits: Math.max(2, minimumDecimals),
      rate: 1,
      isDefault: isFirst,
    },
  })
  const { handleSubmit, reset } = formMethods

  useEffect(() => {
    if (!open) return
    reset({
      code: '',
      symbol: '',
      maximumFractionDigits: Math.max(2, minimumDecimals),
      rate: 1,
      isDefault: isFirst,
    })
  }, [open, isFirst, minimumDecimals, reset])

  const onSubmit = handleSubmit(async (data) => {
    const created = await mutate({
      ...data,
      code: data.code.trim().toUpperCase(),
      symbol: data.symbol.trim(),
      rate: isFirst ? 1 : data.rate,
      isDefault: isFirst,
    })
    if (!created) return
    onAdded(created)
    setOpen(false)
  })

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      title={t('settings.manageCurrencies.button.add')}
    >
      <FormProvider {...formMethods}>
        <form
          onSubmit={(event) => {
            // Don't submit the book or entry form underneath.
            event.stopPropagation()
            void onSubmit(event)
          }}
          className="grid gap-4"
        >
          <div className="grid grid-cols-2 gap-2">
            <Input
              name="code"
              label={t('settings.manageCurrencies.form.code.label')}
              placeholder={t('settings.manageCurrencies.form.code.placeholder')}
              required
              autoFocus // eslint-disable-line jsx-a11y/no-autofocus
            />
            <Input
              name="symbol"
              label={t('settings.manageCurrencies.form.symbol.label')}
              placeholder={t(
                'settings.manageCurrencies.form.symbol.placeholder',
              )}
              required
            />
          </div>
          <NumberInput
            name="maximumFractionDigits"
            label={t(
              'settings.manageCurrencies.form.maximumFractionDigits.label',
            )}
          />
          {isFirst ? (
            <p className="text-sm text-muted-foreground">
              {t('finances.addCurrency.firstIsDefault')}
            </p>
          ) : (
            <NumberInput
              name="rate"
              label={t('finances.addCurrency.rate', {
                code: defaultCurrency?.code ?? '',
              })}
              hint={t('settings.manageCurrencies.form.rate.hint', {
                example: (16_000)
                  .toLocaleString('en-US')
                  .replaceAll(
                    ',',
                    userData?.currencyFormat?.thousandSeparator ??
                      getDefaultCurrencyFormat().thousandSeparator,
                  ),
              })}
              required
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <div className="hidden sm:block">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t('form.cancel')}
              </Button>
            </div>
            <Button
              type="submit"
              isLoading={isPending}
            >
              {t('settings.manageCurrencies.button.save')}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  )
}
