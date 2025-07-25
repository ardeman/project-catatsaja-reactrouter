import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash } from 'lucide-react'
import { useEffect } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { Input } from '~/components/base/input'
import { NumberFormatSelector } from '~/components/base/number-format-selector'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { useCurrency } from '~/lib/contexts/currency'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateCurrency } from '~/lib/hooks/use-update-currency'
import { TUpdateCurrencyRequest } from '~/lib/types/settings'
import { currencySettingSchema } from '~/lib/validations/settings'

export const Currency = () => {
  const { t } = useTranslation()
  const {
    numberFormat,
    currencies,
    defaultCurrency,
    setNumberFormat,
    setCurrencies,
    setDefaultCurrency,
  } = useCurrency()
  const { mutate, isPending } = useUpdateCurrency()
  const { data: userData } = useUserData()

  const formMethods = useForm<TUpdateCurrencyRequest>({
    resolver: zodResolver(currencySettingSchema()),
    defaultValues: {
      numberFormat: userData?.numberFormat ?? numberFormat,
      currencies: userData?.currencies ?? currencies,
      defaultCurrency: userData?.defaultCurrency ?? defaultCurrency,
    },
  })

  useEffect(() => {
    formMethods.reset({
      numberFormat: userData?.numberFormat ?? numberFormat,
      currencies: userData?.currencies ?? currencies,
      defaultCurrency: userData?.defaultCurrency ?? defaultCurrency,
    })
  }, [userData, numberFormat, currencies, defaultCurrency, formMethods])

  const { handleSubmit, watch, control, formState } = formMethods

  const watchNumberFormat = watch('numberFormat')
  const watchCurrencies = watch('currencies')
  const watchDefaultCurrency = watch('defaultCurrency')

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'currencies',
  })

  useEffect(() => {
    if (watchNumberFormat) setNumberFormat(watchNumberFormat)
  }, [watchNumberFormat, setNumberFormat])

  useEffect(() => {
    setCurrencies(watchCurrencies)
  }, [watchCurrencies, setCurrencies])

  useEffect(() => {
    if (watchDefaultCurrency) setDefaultCurrency(watchDefaultCurrency)
  }, [watchDefaultCurrency, setDefaultCurrency])

  const onSubmit = handleSubmit(async (data) => {
    await mutate(data)
  })

  const handleAddCurrency = () => {
    append({ code: '', digits: 0 })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.currency.title')}</CardTitle>
        <CardDescription>{t('settings.currency.description')}</CardDescription>
      </CardHeader>
      <FormProvider {...formMethods}>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-6">
            <NumberFormatSelector
              type="radio"
              value={watchNumberFormat}
              onChange={(value) => formMethods.setValue('numberFormat', value)}
            />
            <div className="space-y-2">
              <Input<TUpdateCurrencyRequest>
                name="defaultCurrency"
                label={t('settings.currency.form.default.selector')}
              />
            </div>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-end gap-2"
                >
                  <Input<TUpdateCurrencyRequest>
                    name={`currencies.${index}.code` as const}
                    label={t('settings.currency.form.currency.code')}
                    className="flex-1"
                  />
                  <Input<TUpdateCurrencyRequest>
                    name={`currencies.${index}.digits` as const}
                    label={t('settings.currency.form.currency.digits')}
                    type="number"
                    className="w-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => remove(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCurrency}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('settings.currency.form.add')}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button
              className="w-fit"
              isLoading={isPending}
              disabled={isPending || !formState.isDirty}
              type="submit"
            >
              {t('form.save')}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  )
}
