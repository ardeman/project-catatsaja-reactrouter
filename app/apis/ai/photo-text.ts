import { firebase } from '~/lib/configs/app-check'
import { geminiModel } from '~/lib/constants/ai'
import { TDictationKind } from '~/lib/types/ai'
import { photoTextSchema } from '~/lib/validations/ai'

const instructions: Record<TDictationKind, string> = {
  text: `Read all the text in this photo (printed or handwritten, any language) and write it out as Markdown, in the language written; don't translate, summarise or answer it. Keep the reading order, paragraphs, headings, lists and checkboxes ("- [ ]", "- [x]") as they appear, and a table as a Markdown table. Fix nothing but obvious recognition slips; write a word you can't read as "[?]". Leave out page numbers, watermarks and text that is only part of the background. text: the Markdown, or "" if the photo has no text.`,
  list: `Read this photo as a to-do or shopping list (printed or handwritten, any language; don't translate). Write each thing to do or buy as one short item on its own line, in the order written, keeping the words; split a line that names several things. No bullets, numbers, checkboxes or "[ ]", and leave out headings, dates and anything that isn't an item. If the photo is running text rather than a list, write each thing it asks to be done as an item. text: the items, one per line, or "" if there are none.`,
}

// Reads the text in a photo with Gemini (Firebase AI Logic, behind App
// Check), as Markdown or as list items, one per line. The photo goes to
// Google only when the person chooses it; nothing is stored. Loaded on
// demand, so the AI SDK isn't in the app's main bundle.
export const readPhotoText = async (
  image: { mimeType: string; data: string },
  kind: TDictationKind = 'text',
): Promise<string> => {
  if (!firebase) {
    throw new Error('Firebase is not initialized.')
  }
  const { getAI, getGenerativeModel, AgentPlatformBackend, Schema } =
    await import('firebase/ai')
  const ai = getAI(firebase, { backend: new AgentPlatformBackend() })
  const model = getGenerativeModel(ai, {
    model: geminiModel,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: Schema.object({
        properties: { text: Schema.string() },
      }),
    },
  })
  const result = await model.generateContent([
    instructions[kind],
    { type: 'inlineData', inlineData: image },
  ])
  let parsed
  try {
    parsed = photoTextSchema.safeParse(JSON.parse(result.response.text()))
  } catch {
    throw new Error('photo/unreadable')
  }
  if (!parsed.success) throw new Error('photo/unreadable')
  const text = parsed.data.text.trim()
  if (!text) throw new Error('photo/empty')
  return text
}
