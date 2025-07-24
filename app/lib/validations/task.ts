import { TFunction } from 'i18next'
import { z } from 'zod'
export const taskSchema = (t: TFunction) =>
  z.object({
    title: z.string().min(1, {
      message: t('zod:errors.invalid_type_received_null'),
    }),
    item: z.string(),
    content: z.array(
      z.object({
        checked: z.boolean(),
        item: z.string().min(1, {
          message: t('zod:errors.invalid_type_received_null'),
        }),
      }),
    ),
  })
