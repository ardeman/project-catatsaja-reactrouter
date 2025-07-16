import { z } from 'zod'
export const taskSchema = z.object({
  title: z.string(),
  content: z.array(
    z.object({
      sequence: z.number(),
      checked: z.boolean(),
      item: z.string(),
    }),
  ),
})
