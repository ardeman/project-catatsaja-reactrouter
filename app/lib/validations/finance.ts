import { TFunction } from 'i18next'
import { z } from 'zod'

// A currency as stored on a book or an entry: copied in, so people a book
// is shared with can read it without that currency in their own settings.
const currencySchema = z.object({
  code: z.string(),
  symbol: z.string(),
  maximumFractionDigits: z.number(),
})

export const entrySchema = (t: TFunction) =>
  z.object({
    id: z.string(),
    date: z
      .string()
      .min(1, { error: t('zod:errors.invalid_type_received_null') }),
    type: z.enum(['income', 'expense']),
    category: z.string().min(1, {
      error: t('zod:errors.invalid_type_received_null'),
    }),
    description: z.string(),
    quantity: z.coerce.number().positive({
      error: t('zod:errors.too_small.number.not_inclusive', { minimum: 0 }),
    }),
    amount: z.coerce.number().positive({
      error: t('zod:errors.too_small.number.not_inclusive', { minimum: 0 }),
    }),
    currency: currencySchema,
    // Book-currency units for 1 unit of the entry's currency.
    rate: z.coerce.number().positive({
      error: t('zod:errors.too_small.number.not_inclusive', { minimum: 0 }),
    }),
  })

export const bookSchema = z.object({
  title: z.string(),
  currency: currencySchema,
})
