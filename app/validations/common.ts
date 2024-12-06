import * as z from 'zod'
export const shareSchema = z.object({
  collaborators: z.array(z.string()),
  spectators: z.array(z.string()),
})
