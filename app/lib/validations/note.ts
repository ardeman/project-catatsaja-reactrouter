import { z } from 'zod'
export const noteSchema = z.object({
  title: z.string(),
  content: z.string(),
})

// What Gemini returns for a note helper (`app/apis/ai/note.ts`); fields the
// helper doesn't use are empty. Checked before use.
export const noteHelperSchema = z.object({
  title: z.string(),
  markdown: z.string(),
  items: z.array(z.string()),
})
