import { TFunction } from 'i18next'
import { z } from 'zod'
export const financeSchema = (t: TFunction) =>
  z.object({
    title: z.string().min(1, {
      message: t('zod:errors.invalid_type_received_null'),
    }),
    item: z.object({
      date: z.string(),
      description: z.string(),
      amount: z.number(),
      currency: z.string(),
      rate: z.number(),
      category: z.string(),
      type: z.enum(['income', 'expense']),
    }),
    content: z.array(
      z.object({
        date: z.string().min(1, {
          message: t('zod:errors.invalid_type_received_null'),
        }),
        description: z.string().min(1, {
          message: t('zod:errors.invalid_type_received_null'),
        }),
        amount: z.number().min(1, {
          message: t('zod:errors.invalid_type_received_null'),
        }),
        currency: z.string().min(1, {
          message: t('zod:errors.invalid_type_received_null'),
        }),
        rate: z.number().min(1, {
          message: t('zod:errors.invalid_type_received_null'),
        }),
        category: z.string().min(1, {
          message: t('zod:errors.invalid_type_received_null'),
        }),
        type: z.enum(['income', 'expense']),
      }),
    ),
  })
