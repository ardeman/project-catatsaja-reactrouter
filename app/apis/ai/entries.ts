import { firebase } from '~/lib/configs/firebase'
import { geminiModel } from '~/lib/constants/ai'
import { TTypedEntries } from '~/lib/types/finance'
import { typedEntriesSchema } from '~/lib/validations/finance'

const instructions = (
  today: string,
  weekday: string,
) => `Turn this note of money spent or received into entries. Today is ${today} (${weekday}).
- One entry per thing paid or received, in the order written. description: what it was, short, in the note's own language and words (capitalise the first letter), without the amount or the date.
- type: "income" for money received (salary/gaji, bonus, payment received, refund, sold something), otherwise "expense".
- quantity and unitPrice: "2 kopi 18rb" is quantity 2 at 18000 each only when the price is clearly per item ("2x18rb", "@18rb", "18rb each"); otherwise quantity 1 and unitPrice the amount written.
- Amounts are plain numbers: rb/ribu/k = thousand, jt/juta = million, "1,5jt" and "1.5jt" = 1500000, "Rp 25.000" = 25000, "$3.50" = 3.5.
- date as YYYY-MM-DD from words like today/hari ini, yesterday/kemarin, kemarin lusa (2 days ago), a weekday ("Senin" = the most recent Monday, not in the future), or a written date (day first: 5/10 is 5 October). Use "" when the note gives no day for that entry; a day written once applies to the entries that follow it.
- currency: the ISO 4217 code when the note names one (Rp/IDR, $/USD, S$/SGD, RM/MYR, €/EUR, ¥/JPY), else "".
- Leave out anything without an amount. Never guess amounts. If the note has no money in it, return no entries.

Note:
`

// Reads typed text about money with Gemini (Firebase AI Logic, behind App
// Check). Sent only when the person asks; nothing is stored. Loaded on
// demand, so the AI SDK isn't in the app's main bundle.
export const readTypedEntries = async ({
  text,
  today,
  weekday,
}: {
  text: string
  today: string
  weekday: string
}): Promise<TTypedEntries> => {
  if (!firebase) {
    throw new Error('Firebase is not initialized.')
  }
  const { getAI, getGenerativeModel, GoogleAIBackend, Schema } =
    await import('firebase/ai')
  const entry = Schema.object({
    properties: {
      description: Schema.string(),
      type: Schema.enumString({ enum: ['income', 'expense'] }),
      quantity: Schema.number(),
      unitPrice: Schema.number(),
      date: Schema.string(),
    },
  })
  const responseSchema = Schema.object({
    properties: {
      currency: Schema.string(),
      entries: Schema.array({ items: entry }),
    },
  })
  const ai = getAI(firebase, { backend: new GoogleAIBackend() })
  const model = getGenerativeModel(ai, {
    model: geminiModel,
    generationConfig: { responseMimeType: 'application/json', responseSchema },
  })
  const result = await model.generateContent(
    instructions(today, weekday) + text,
  )
  let parsed
  try {
    parsed = typedEntriesSchema.safeParse(JSON.parse(result.response.text()))
  } catch {
    throw new Error('typed/unreadable')
  }
  if (!parsed.success) throw new Error('typed/unreadable')
  return parsed.data
}
