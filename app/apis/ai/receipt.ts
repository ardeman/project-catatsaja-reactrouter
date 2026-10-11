import { firebase } from '~/lib/configs/firebase'
import { geminiModel } from '~/lib/constants/ai'
import { TReceipt } from '~/lib/types/finance'
import { receiptSchema } from '~/lib/validations/finance'

const instructions = `Read this shopping receipt or bill and return its contents.
- merchant: the shop or business name as printed, or "" if none.
- date: the purchase date as YYYY-MM-DD, or "" if none. Receipts in Indonesia write dates day first (DD/MM/YYYY).
- currency: the ISO 4217 code of the amounts (for example IDR, USD, SGD), or "" if it can't be told. "Rp" is IDR.
- items: every purchased line. description as printed (expand obvious abbreviations), quantity, and unitPrice: the price of one after any discount printed on that line.
- charges: tax, service charge, delivery, packaging, tips and other additions to the whole bill, each with its amount.
- discount: a discount on the whole bill (vouchers, promotions, rounding down) as a positive number, or 0.
- total: the amount paid, or 0 if it can't be read.
Write amounts as plain numbers in the currency's units: "Rp 25.000" is 25000, "$3.50" is 3.5. Use 0 or "" for anything you can't read; never guess. If the image is not a receipt, return no items and 0 total.`

// Reads a receipt photo with Gemini (Firebase AI Logic, behind App Check).
// The photo goes to Google only when the person asks; nothing is stored.
// Loaded on demand, so the AI SDK isn't in the app's main bundle.
export const readReceipt = async (image: {
  mimeType: string
  data: string
}): Promise<TReceipt> => {
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
        properties: {
          merchant: Schema.string(),
          date: Schema.string(),
          currency: Schema.string(),
          items: Schema.array({
            items: Schema.object({
              properties: {
                description: Schema.string(),
                quantity: Schema.number(),
                unitPrice: Schema.number(),
              },
            }),
          }),
          charges: Schema.array({
            items: Schema.object({
              properties: {
                description: Schema.string(),
                amount: Schema.number(),
              },
            }),
          }),
          discount: Schema.number(),
          total: Schema.number(),
        },
      }),
    },
  })
  const result = await model.generateContent([
    instructions,
    { type: 'inlineData', inlineData: image },
  ])
  let parsed
  try {
    parsed = receiptSchema.safeParse(JSON.parse(result.response.text()))
  } catch {
    throw new Error('receipt/unreadable')
  }
  if (!parsed.success) throw new Error('receipt/unreadable')
  return parsed.data
}
