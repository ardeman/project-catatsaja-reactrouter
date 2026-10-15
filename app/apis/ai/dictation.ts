import { firebase } from '~/lib/configs/app-check'
import { geminiModel } from '~/lib/constants/ai'
import { dictationSchema } from '~/lib/validations/ai'

const instructions = `Transcribe this voice recording word for word, in the language spoken (any language; if it switches language, keep each part as spoken). Don't translate, summarise or answer it. Add punctuation and capitalisation, and start a new paragraph (a blank line) where the speaker moves to a new topic. Leave out filler sounds ("um", "eh") and false starts. text: the transcript, or "" if nothing is said.`

// Transcribes a voice recording with Gemini (Firebase AI Logic, behind App
// Check). The recording goes to Google only when the person stops recording;
// nothing is stored. Loaded on demand, so the AI SDK isn't in the app's main
// bundle.
export const transcribeAudio = async (audio: {
  mimeType: string
  data: string
}): Promise<string> => {
  if (!firebase) {
    throw new Error('Firebase is not initialized.')
  }
  const { getAI, getGenerativeModel, GoogleAIBackend, Schema } =
    await import('firebase/ai')
  const ai = getAI(firebase, { backend: new GoogleAIBackend() })
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
    instructions,
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
