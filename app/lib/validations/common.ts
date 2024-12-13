import { z } from 'zod'
export const shareSchema = z.object({
  writers: z.array(z.string()),
  readers: z.array(z.string()),
})
