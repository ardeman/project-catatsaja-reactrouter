import { z } from 'zod'

export const dictationSchema = z.object({
  text: z.string(),
})

export const photoTextSchema = z.object({
  text: z.string(),
})
