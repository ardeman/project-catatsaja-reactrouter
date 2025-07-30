import { TFunction } from 'i18next'
import { z } from 'zod'

export const generalSettingSchema = (t: TFunction) =>
  z.object({
    displayName: z.string().min(1, {
      message: t('settings.validation.displayName.required'),
    }),
  })

export const currencyFormatSchema = (
  t: TFunction,
  maxFractionDigitsMin: number = 0,
) =>
  z
    .object({
      thousandSeparator: z.string().min(1, {
        message: t(
          'settings.currencyFormat.validation.thousandSeparator.required',
        ),
      }),
      decimalSeparator: z.string().min(1, {
        message: t(
          'settings.currencyFormat.validation.decimalSeparator.required',
        ),
      }),
      minimumFractionDigits: z.coerce
        .number()
        .min(0, {
          message: t('zod:errors.too_small.number.inclusive', { minimum: 0 }),
        })
        .max(Math.min(10, maxFractionDigitsMin), {
          message: t(
            'settings.currencyFormat.validation.minimumFractionDigits.max',
            { max: Math.min(10, maxFractionDigitsMin) },
          ),
        }),
      currencyPlacement: z.enum(['before', 'after']),
      currencyType: z.enum(['symbol', 'code']),
      addSpace: z.boolean(),
    })
    .refine((data) => data.thousandSeparator !== data.decimalSeparator, {
      message: t('settings.currencyFormat.validation.separators.same'),
      path: ['decimalSeparator'],
    })

export const currencySchema = (t: TFunction, minFractionDigits: number = 0) =>
  z.object({
    id: z.string().optional(),
    symbol: z.string().min(1, {
      message: t('settings.manageCurrencies.validation.symbol.required'),
    }),
    code: z.string().min(1, {
      message: t('settings.manageCurrencies.validation.code.required'),
    }),
    maximumFractionDigits: z.coerce
      .number()
      .min(minFractionDigits, {
        message: t(
          'settings.manageCurrencies.validation.maximumFractionDigits.min',
          { min: minFractionDigits },
        ),
      })
      .max(10, {
        message: t('zod:errors.too_big.number.inclusive', { maximum: 10 }),
      }),
    rate: z.coerce.number().min(0, {
      message: t('zod:errors.too_small.number.inclusive', { minimum: 0 }),
    }),
    isDefault: z.boolean().default(false),
  })
