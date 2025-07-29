import { TFunction } from 'i18next'
import { z } from 'zod'

export const generalSettingSchema = (t: TFunction) =>
  z.object({
    displayName: z.string().min(1, {
      message: t('settings.validation.displayName.required'),
    }),
  })

export const currencyFormatSchema = (t: TFunction) =>
  z
    .object({
      thousandSeparator: z
        .string()
        .min(1, {
          message: t(
            'settings.currencyFormat.validation.thousandSeparator.required',
          ),
        }),
      decimalSeparator: z
        .string()
        .min(1, {
          message: t(
            'settings.currencyFormat.validation.decimalSeparator.required',
          ),
        }),
      minimumFractionDigits: z.coerce.number().min(0).max(10),
      currencyPlacement: z.enum(['before', 'after']),
      currencyType: z.enum(['symbol', 'code']),
      addSpace: z.boolean(),
    })
    .refine((data) => data.thousandSeparator !== data.decimalSeparator, {
      message: t('settings.currencyFormat.validation.separators.same'),
      path: ['decimalSeparator'],
    })
