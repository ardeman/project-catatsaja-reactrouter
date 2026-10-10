import { zodResolver } from '@hookform/resolvers/zod'
import { SlidersHorizontal } from 'lucide-react'
import React, { useState } from 'react'
import { FormProvider, useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { ChoiceCards } from '~/components/base/choice-cards'
import { Input } from '~/components/base/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { useGetCurrencies } from '~/lib/hooks/use-get-currencies'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateCurrencyFormat } from '~/lib/hooks/use-update-currency-format'
import {
  TCurrencyFormatForm,
  TCurrencyFormatRequest,
} from '~/lib/types/settings'
import { formatCurrency, getDefaultCurrencyFormat } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'
import { currencyFormatSchema } from '~/lib/validations/settings'

import { useCurrencySettings } from './context'

// The common ways to write numbers; anything else is "custom".
const numberStyles = [
  { key: 'dotComma', thousandSeparator: '.', decimalSeparator: ',' },
  { key: 'commaDot', thousandSeparator: ',', decimalSeparator: '.' },
] as const

type TNumberStyle = (typeof numberStyles)[number]['key'] | 'custom'

const styleOf = (format: {
  thousandSeparator: string
  decimalSeparator: string
}): TNumberStyle =>
  numberStyles.find(
    (style) =>
      style.thousandSeparator === format.thousandSeparator &&
      style.decimalSeparator === format.decimalSeparator,
  )?.key ?? 'custom'

export const CurrencyFormat = () => {
  const { disabled, setDisabled } = useCurrencySettings()
  const { t } = useTranslation()
  const { data: userData } = useUserData()
  const { data: currencies = [] } = useGetCurrencies()
  const { mutate, isPending } = useUpdateCurrencyFormat()

  const defaultValues = userData?.currencyFormat || getDefaultCurrencyFormat()

  // Get minimum maximumFractionDigits from existing currencies
  const minMaximumFractionDigits = React.useMemo(() => {
    if (currencies.length === 0) return 10 // Default to 10 if no currencies exist
    return Math.min(...currencies.map((c) => c.maximumFractionDigits))
  }, [currencies])

  const formMethods = useForm<
    TCurrencyFormatForm,
    unknown,
    TCurrencyFormatRequest
  >({
    resolver: zodResolver(currencyFormatSchema(t, minMaximumFractionDigits)),
    values: defaultValues,
  })

  const { handleSubmit, watch, formState, setValue } = formMethods
  const watchAll = watch()

  // "Custom" stays open once chosen, even if it matches a common style.
  const [isCustom, setIsCustom] = useState(false)
  const numberStyle = isCustom ? 'custom' : styleOf(watchAll)

  const handleNumberStyle = (key: TNumberStyle) => {
    setIsCustom(key === 'custom')
    const style = numberStyles.find((option) => option.key === key)
    if (!style) return
    const options = { shouldDirty: true, shouldValidate: true }
    setValue('thousandSeparator', style.thousandSeparator, options)
    setValue('decimalSeparator', style.decimalSeparator, options)
  }

  // Preview amount
  const previewAmount = 12_345_678

  const onSubmit = handleSubmit(async (data) => {
    setDisabled(true)
    await mutate(data)
    setDisabled(false)
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.currencyFormat.title')}</CardTitle>
        <CardDescription>
          {t('settings.currencyFormat.description')}
        </CardDescription>
      </CardHeader>
      <FormProvider {...formMethods}>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-6">
            <ChoiceCards<TNumberStyle>
              label={t('settings.currencyFormat.form.numberStyle.label')}
              hint={t('settings.currencyFormat.form.numberStyle.hint')}
              value={numberStyle}
              onChange={handleNumberStyle}
              className="grid-cols-3"
              options={[
                ...numberStyles.map((style) => ({
                  value: style.key,
                  label: t(
                    `settings.currencyFormat.form.numberStyle.${style.key}`,
                  ),
                  visual: (
                    <span className="font-mono text-sm sm:text-base">
                      1{style.thousandSeparator}234{style.decimalSeparator}56
                    </span>
                  ),
                })),
                {
                  value: 'custom' as const,
                  label: t('settings.currencyFormat.form.numberStyle.custom'),
                  visual: <SlidersHorizontal className="size-5" />,
                },
              ]}
            />

            <div
              className={cn(
                'grid grid-cols-1 gap-4',
                numberStyle === 'custom' ? 'sm:grid-cols-3' : 'sm:grid-cols-1',
              )}
            >
              {numberStyle === 'custom' && (
                <>
                  <Input
                    label={t(
                      'settings.currencyFormat.form.thousandSeparator.label',
                    )}
                    name="thousandSeparator"
                    placeholder={t(
                      'settings.currencyFormat.form.thousandSeparator.placeholder',
                    )}
                    maxLength={1}
                    className="w-full"
                  />
                  <Input
                    label={t(
                      'settings.currencyFormat.form.decimalSeparator.label',
                    )}
                    name="decimalSeparator"
                    placeholder={t(
                      'settings.currencyFormat.form.decimalSeparator.placeholder',
                    )}
                    maxLength={1}
                    className="w-full"
                  />
                </>
              )}
              <Input
                label={t(
                  'settings.currencyFormat.form.minimumFractionDigits.label',
                )}
                hint={t(
                  'settings.currencyFormat.form.minimumFractionDigits.hint',
                  {
                    example: `1${watchAll.thousandSeparator}000${watchAll.decimalSeparator}00`,
                  },
                )}
                name="minimumFractionDigits"
                type="number"
                min={0}
                placeholder={t(
                  'settings.currencyFormat.form.minimumFractionDigits.placeholder',
                )}
                className={cn(
                  'w-full',
                  numberStyle !== 'custom' && 'sm:max-w-sm',
                )}
              />
            </div>

            <div className="grid gap-6">
              <Controller
                control={formMethods.control}
                name="currencyPlacement"
                render={({ field }) => (
                  <ChoiceCards
                    label={t(
                      'settings.currencyFormat.form.currencyPlacement.label',
                    )}
                    value={field.value}
                    onChange={field.onChange}
                    className="grid-cols-2 sm:max-w-md"
                    options={(['before', 'after'] as const).map((value) => ({
                      value,
                      label: t(
                        `settings.currencyFormat.form.currencyPlacement.${value}`,
                      ),
                    }))}
                  />
                )}
              />
              <Controller
                control={formMethods.control}
                name="currencyType"
                render={({ field }) => (
                  <ChoiceCards
                    label={t('settings.currencyFormat.form.currencyType.label')}
                    value={field.value}
                    onChange={field.onChange}
                    className="grid-cols-2 sm:max-w-md"
                    options={(['symbol', 'code'] as const).map((value) => ({
                      value,
                      label: t(
                        `settings.currencyFormat.form.currencyType.${value}`,
                      ),
                    }))}
                  />
                )}
              />
              <Controller
                control={formMethods.control}
                name="addSpace"
                render={({ field }) => (
                  <ChoiceCards
                    label={t('settings.currencyFormat.form.addSpace.label')}
                    value={field.value ? 'true' : 'false'}
                    onChange={(value) => field.onChange(value === 'true')}
                    className="grid-cols-2 sm:max-w-md"
                    options={[
                      { value: 'true', label: t('form.yes') },
                      { value: 'false', label: t('form.no') },
                    ]}
                  />
                )}
              />
            </div>

            {/* Preview Section */}
            <div
              aria-live="polite"
              className="rounded-lg border border-dashed bg-muted/40 p-4"
            >
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t('settings.currencyFormat.preview.label')}
              </p>
              <div className="mt-1 font-mono text-2xl break-all">
                {formatCurrency({
                  amount: previewAmount,
                  format: {
                    ...watchAll,
                    minimumFractionDigits: Number(
                      watchAll.minimumFractionDigits,
                    ),
                  },
                  currencies,
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button
              className="w-fit"
              isLoading={isPending}
              disabled={isPending || disabled || !formState.isDirty}
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
