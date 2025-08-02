import { TFunction } from 'i18next'
import { z } from 'zod'

export const titleSchema = (t: TFunction) =>
  z.object({
    title: z.string().min(1, {
      message: t('zod:errors.invalid_type_received_null'),
    }),
  })

export const itemSchema = (t: TFunction) =>
  z.object({
    date: z.string().min(1, {
      message: t('zod:errors.invalid_type_received_null'),
    }),
    description: z.string().min(1, {
      message: t('zod:errors.invalid_type_received_null'),
    }),
    quantity: z.number().min(1, {
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
    total: z.number().min(1, {
      message: t('zod:errors.invalid_type_received_null'),
    }),
    category: z.string().min(1, {
      message: t('zod:errors.invalid_type_received_null'),
    }),
    type: z.enum(['income', 'expense']),
  })
