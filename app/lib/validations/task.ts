import { TFunction } from 'i18next'
import { z } from 'zod'
export const taskSchema = (t: TFunction) => {
  const taskItem = z.object({
    checked: z.boolean(),
    item: z.string().min(1, {
      error: t('zod:errors.invalid_type_received_null'),
    }),
  })
  return z.object({
    title: z.string(),
    item: z.string(),
    content: z.array(taskItem),
  })
}
