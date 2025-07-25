import { z } from 'zod'

export const generalSettingSchema = z.object({
  displayName: z.string().min(1, { message: 'Display name is required.' }),
})

export const currencySettingSchema = () =>
  z.object({
    numberFormat: z.string().min(1, { message: 'Required' }),
    currencies: z.array(
      z.object({
        code: z.string().min(1, { message: 'Required' }),
        digits: z.number().min(0).max(8),
      }),
    ),
    defaultCurrency: z.string().min(1, { message: 'Required' }),
  })
