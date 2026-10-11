import { firebase } from '~/lib/configs/firebase'
import { geminiModel } from '~/lib/constants/ai'
import { TNoteHelper, TNoteHelperResult } from '~/lib/types/note'
import { noteHelperSchema } from '~/lib/validations/note'

const KEEP = `Keep the Markdown formatting (headings, lists, checklists, links, bold) and never add facts that aren't in the note.`

const instructions: Record<TNoteHelper, string> = {
  summarise: `Summarise this note in its own language. markdown: a first line "**Summary**" ("**Ringkasan**" if the note is in Indonesian), then 2 to 5 short bullet points ("- "). title and items: empty. ${KEEP}`,
  tidy: `Tidy up this note in its own language: fix spelling, grammar, punctuation and capitalisation, and make the formatting consistent, keeping the meaning, tone and structure; don't shorten or add content. title: the tidied title (empty if it has none). markdown: the tidied note. items: empty. ${KEEP}`,
  translate: `Translate this note: into English if it is mostly in Indonesian, otherwise into Indonesian (natural, informal "kamu" style). Leave names and code as they are; write amounts the way the target language does ("1,5jt" is "1.5 million" in English, "1.5 million" is "1,5 juta" in Indonesian). title: the translated title (empty if it has none). markdown: the translated note. items: empty. ${KEEP}`,
  checklist: `Turn this note into a checklist of the things to do in it, in its own language: short, actionable items, one per task, in order, without duplicates. If it has no clear tasks, use its main points. title: a short title for the list (the note's title if it fits). items: the checklist items as plain text (no "- " or "[ ]"). markdown: empty.`,
}

// Runs a note helper with Gemini (Firebase AI Logic, behind App Check).
// The note is sent only when the person picks a helper; nothing is stored.
// Loaded on demand, so the AI SDK isn't in the app's main bundle.
export const runNoteHelper = async ({
  helper,
  title,
  content,
}: {
  helper: TNoteHelper
  title: string
  content: string
}): Promise<TNoteHelperResult> => {
  if (!firebase) {
    throw new Error('Firebase is not initialized.')
  }
  const { getAI, getGenerativeModel, GoogleAIBackend, Schema } =
    await import('firebase/ai')
  const items = Schema.array({ items: Schema.string() })
  const responseSchema = Schema.object({
    properties: {
      title: Schema.string(),
      markdown: Schema.string(),
      items,
    },
  })
  const ai = getAI(firebase, { backend: new GoogleAIBackend() })
  const model = getGenerativeModel(ai, {
    model: geminiModel,
    generationConfig: { responseMimeType: 'application/json', responseSchema },
  })
  const result = await model.generateContent(
    `${instructions[helper]}\n\nTitle: ${title}\n\nNote:\n${content}`,
  )
  let parsed
  try {
    parsed = noteHelperSchema.safeParse(JSON.parse(result.response.text()))
  } catch {
    throw new Error('note/unreadable')
  }
  if (!parsed.success) throw new Error('note/unreadable')
  const answer = parsed.data
  const isEmpty =
    helper === 'checklist'
      ? answer.items.filter((item) => item.trim()).length === 0
      : !answer.markdown.trim()
  if (isEmpty) throw new Error('note/unreadable')
  return answer
}
