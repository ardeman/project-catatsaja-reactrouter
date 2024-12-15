import { TFunction } from 'i18next'
import { z } from 'zod'
export const shareSchema = (t: TFunction) =>
  z.object({
    user: z.string().min(1, {
      message: t('zod:errors.invalid_type_received_null'),
    }),
  })
