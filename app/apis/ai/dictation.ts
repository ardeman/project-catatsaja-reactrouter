import { firebase } from '~/lib/configs/app-check'
import { geminiModel } from '~/lib/constants/ai'
import { TDictationKind } from '~/lib/types/ai'
import { dictationSchema } from '~/lib/validations/ai'

const instructions: Record<TDictationKind, string> = {
  text: `Transcribe this voice recording word for word, in the language spoken (any language; if it switches language, keep each part as spoken). Don't translate, summarise or answer it. Add punctuation and capitalisation, and start a new paragraph (a blank line) where the speaker moves to a new topic. Leave out filler sounds ("um", "eh") and false starts. text: the transcript, or "" if nothing is said.`,
  list: `Transcribe this voice recording as a to-do list, in the language spoken (any language; don't translate). Write each thing to do the person names as one short item on its own line, in the order said, keeping their words; split a sentence that names several things. No bullets, numbers or "[ ]", and leave out filler sounds, false starts and anything that isn't an item. text: the items, one per line, or "" if nothing is said.`,
}

// Transcribes a voice recording with Gemini (Firebase AI Logic, behind App
// Check), as running text or as list items, one per line. The recording goes
// to Google only when the person stops recording; nothing is stored. Loaded
// on demand, so the AI SDK isn't in the app's main bundle.
export const transcribeAudio = async (
  audio: { mimeType: string; data: string },
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
    { type: 'inlineData', inlineData: audio },
  ])
  let parsed
  try {
    parsed = dictationSchema.safeParse(JSON.parse(result.response.text()))
  } catch {
    throw new Error('dictation/unreadable')
  }
  if (!parsed.success) throw new Error('dictation/unreadable')
  const text = parsed.data.text.trim()
  if (!text) throw new Error('dictation/empty')
  return text
}
