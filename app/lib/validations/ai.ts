import { z } from 'zod'

export const dictationSchema = z.object({
  text: z.string(),
})
