import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { Input } from '~/components/base/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateCurrencyFormat } from '~/lib/hooks/use-update-currency-format'
import { TCurrencyFormatRequest } from '~/lib/types/settings'
import { formatCurrency, getDefaultCurrencyFormat } from '~/lib/utils/parser'
import { currencyFormatSchema } from '~/lib/validations/settings'

import { useCurrencySettings } from './context'

export const CurrencyFormat = () => {
  const { disabled, setDisabled } = useCurrencySettings()
  const { t } = useTranslation()
  const { data: userData } = useUserData()
  const { mutate, isPending } = useUpdateCurrencyFormat()

  const defaultValues = userData?.currencyFormat || getDefaultCurrencyFormat()

  const formMethods = useForm<TCurrencyFormatRequest>({
    resolver: zodResolver(currencyFormatSchema(t)),
    values: defaultValues,
  })

  const { handleSubmit, watch, formState } = formMethods
  const watchAll = watch()

  // Preview amount
  const previewAmount = 1_234_567

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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label={t(
                  'settings.currencyFormat.form.thousandSeparator.label',
                )}
                name="thousandSeparator"
                placeholder={t(
                  'settings.currencyFormat.form.thousandSeparator.placeholder',
                )}
                className="w-full"
              />
              <Input
                label={t('settings.currencyFormat.form.decimalSeparator.label')}
                name="decimalSeparator"
                placeholder={t(
                  'settings.currencyFormat.form.decimalSeparator.placeholder',
                )}
                className="w-full"
              />
              <Input
                label={t(
                  'settings.currencyFormat.form.minimumFractionDigits.label',
                )}
                name="minimumFractionDigits"
                type="number"
                min="0"
                max="10"
                placeholder={t(
                  'settings.currencyFormat.form.minimumFractionDigits.placeholder',
                )}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>
                  {t('settings.currencyFormat.form.currencyPlacement.label')}
                </Label>
                <Controller
                  control={formMethods.control}
                  name="currencyPlacement"
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="before"
                          id="before"
                        />
                        <Label htmlFor="before">
                          {t(
                            'settings.currencyFormat.form.currencyPlacement.before',
                          )}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="after"
                          id="after"
                        />
                        <Label htmlFor="after">
                          {t(
                            'settings.currencyFormat.form.currencyPlacement.after',
                          )}
                        </Label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {t('settings.currencyFormat.form.currencyType.label')}
                </Label>
                <Controller
                  control={formMethods.control}
                  name="currencyType"
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="symbol"
                          id="symbol"
                        />
                        <Label htmlFor="symbol">
                          {t(
                            'settings.currencyFormat.form.currencyType.symbol',
                          )}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="code"
                          id="code"
                        />
                        <Label htmlFor="code">
                          {t('settings.currencyFormat.form.currencyType.code')}
                        </Label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {t('settings.currencyFormat.form.addSpace.label')}
                </Label>
                <Controller
                  control={formMethods.control}
                  name="addSpace"
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={(value) =>
                        field.onChange(value === 'true')
                      }
                      value={field.value ? 'true' : 'false'}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="true"
                          id="addSpaceYes"
                        />
                        <Label htmlFor="addSpaceYes">{t('form.yes')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="false"
                          id="addSpaceNo"
                        />
                        <Label htmlFor="addSpaceNo">{t('form.no')}</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>
            </div>

            {/* Preview Section */}
            <div className="rounded-lg border p-4">
              <Label className="text-sm font-medium">
                {t('settings.currencyFormat.preview.label')}
              </Label>
              <div className="mt-2 font-mono text-lg">
                {t('settings.currencyFormat.preview.example', {
                  amount: formatCurrency(previewAmount, watchAll),
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
