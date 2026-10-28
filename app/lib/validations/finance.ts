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

// Money moved from one of a book's accounts to another: both balances
// change, the book's totals don't.
export const transferSchema = (t: TFunction) =>
  z
    .object({
      from: z
        .string()
        .min(1, { error: t('zod:errors.invalid_type_received_null') }),
      to: z
        .string()
        .min(1, { error: t('zod:errors.invalid_type_received_null') }),
      amount: z.coerce.number().positive({
        error: t('zod:errors.too_small.number.not_inclusive', { minimum: 0 }),
      }),
    })
    .refine((transfer) => transfer.from !== transfer.to, {
      error: t('finances.accounts.move.sameAccount'),
      path: ['to'],
    })

export const bookSchema = z.object({
  title: z.string(),
  currency: currencySchema,
})

// What Gemini reads from a receipt photo (`app/apis/ai/receipt.ts`). Checked
// before use, since a model's answer can be malformed. Unknown text is "",
// unknown numbers 0.
const receiptItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  // The printed price of one.
  unitPrice: z.number(),
  // A discount printed for this line, as a positive number for the line.
  discount: z.number(),
})

const receiptChargeSchema = z.object({
  description: z.string(),
  amount: z.number(),
})

export const receiptSchema = z.object({
  merchant: z.string(),
  // YYYY-MM-DD, or "" when the receipt has no readable date.
  date: z.string(),
  // ISO 4217, or "" when the receipt doesn't show one.
  currency: z.string(),
  items: z.array(receiptItemSchema),
  // Tax, service charge, delivery and other additions to the whole receipt.
  charges: z.array(receiptChargeSchema),
  // A discount on the whole receipt, as a positive number.
  discount: z.number(),
  total: z.number(),
})

const typedEntrySchema = z.object({
  description: z.string(),
  type: z.enum(['income', 'expense']),
  quantity: z.number(),
  unitPrice: z.number(),
  // YYYY-MM-DD, or "" when the text gives no day.
  date: z.string(),
})

// What Gemini reads from text someone typed, such as "makan siang 45rb
// kemarin, gaji 5jt" (`app/apis/ai/entries.ts`). Checked before use.
export const typedEntriesSchema = z.object({
  // ISO 4217 when the text names or implies one (like "$"), else "".
  currency: z.string(),
  entries: z.array(typedEntrySchema),
})
