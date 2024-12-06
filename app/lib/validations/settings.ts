import * as z from 'zod'

export const generalSettingSchema = z.object({
  displayName: z.string().min(1, { message: 'Display name is required.' }),
})
