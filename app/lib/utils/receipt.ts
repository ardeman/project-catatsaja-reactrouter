// Turns a receipt read by Gemini into finance entries. Pure logic, no app
// imports, so it can be tested on its own (tests/receipt.test.mjs): the
// caller passes the currency, its rate and how to pick a category.

type TReceiptLine = { description: string; quantity: number; amount: number }

type TReceipt = {
  merchant: string
  date: string
  currency: string
  items: { description: string; quantity: number; unitPrice: number }[]
  charges: { description: string; amount: number }[]
  discount: number
  total: number
}

type TCurrency = { code: string; symbol: string; maximumFractionDigits: number }

type TEntry = {
  id: string
  date: string
  type: 'expense'
  category: string
  description: string
  quantity: number
  amount: number
  currency: TCurrency
  rate: number
}

const round = (value: number, digits: number) => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

const isPositive = (value: number) => Number.isFinite(value) && value > 0

// The receipt's date when it is a real day, not in the future; otherwise
// `today` (both YYYY-MM-DD).
export const receiptDate = (date: string, today: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return today
  const parsed = new Date(`${date}T00:00:00Z`)
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  )
    return today
  return date > today ? today : date
}

// Its lines: items with a receipt-wide discount spread over them by price,
// then charges such as tax. Lines without a positive price are left out.
export const receiptLines = (
  receipt: TReceipt,
  fractionDigits: number,
): TReceiptLine[] => {
  const items = receipt.items
    .map((item) => ({
      description: item.description.trim(),
      quantity: isPositive(item.quantity) ? item.quantity : 1,
      amount: item.unitPrice,
    }))
    .filter((item) => isPositive(item.amount))
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.amount,
    0,
  )
  const discount = isPositive(receipt.discount)
    ? Math.min(receipt.discount, subtotal)
    : 0
  const factor = subtotal > 0 ? 1 - discount / subtotal : 1
  const charges = receipt.charges
    .filter((charge) => isPositive(charge.amount))
    .map((charge) => ({
      description: charge.description.trim(),
      quantity: 1,
      amount: charge.amount,
    }))
  const discounted = items.map((item) => ({
    ...item,
    amount: round(item.amount * factor, fractionDigits),
  }))
  // Rounding each price can leave the items a little off what was paid for
  // them; the most expensive single item takes up the difference.
  const leftover = round(
    subtotal -
      discount -
      discounted.reduce((sum, item) => sum + item.quantity * item.amount, 0),
    fractionDigits,
  )
  const single = discounted
    .filter((item) => item.quantity === 1)
    .toSorted((a, b) => b.amount - a.amount)[0]
  if (single && leftover !== 0)
    single.amount = round(single.amount + leftover, fractionDigits)
  return [
    ...discounted,
    ...charges.map((charge) => ({
      ...charge,
      amount: round(charge.amount, fractionDigits),
    })),
  ].filter((line) => isPositive(line.amount))
}

// What the receipt adds up to: its printed total, or the sum of its lines
// when the total couldn't be read.
export const receiptTotal = (receipt: TReceipt, fractionDigits: number) =>
  isPositive(receipt.total)
    ? round(receipt.total, fractionDigits)
    : round(
        receiptLines(receipt, fractionDigits).reduce(
          (sum, line) => sum + line.quantity * line.amount,
          0,
        ),
        fractionDigits,
      )

// What the lines add up to, and whether that is too far from the total to
// be rounding (a spread discount can be off by half a unit per item bought):
// a misread line, or a charge left out, worth a look before adding.
export const receiptMismatch = (receipt: TReceipt, fractionDigits: number) => {
  const lines = receiptLines(receipt, fractionDigits)
  const sum = round(
    lines.reduce((total, line) => total + line.quantity * line.amount, 0),
    fractionDigits,
  )
  const unit = 10 ** -fractionDigits
  const tolerance =
    unit / 2 + lines.reduce((total, line) => total + line.quantity, 0) * unit
  return {
    lines: sum,
    isMismatch:
      Math.abs(sum - receiptTotal(receipt, fractionDigits)) > tolerance,
  }
}

// Expense entries for a receipt: one for its total (described by the
// shop's name), or one per line. A line's category comes from its own
// description, else from the shop's name, else `fallbackCategory`.
export const receiptToEntries = ({
  receipt,
  mode,
  date,
  currency,
  rate,
  categoryFor,
  fallbackCategory,
  newId,
}: {
  receipt: TReceipt
  mode: 'total' | 'items'
  date: string
  currency: TCurrency
  rate: number
  categoryFor: (description: string) => string | undefined
  fallbackCategory: string
  newId: () => string
}): TEntry[] => {
  const merchant = receipt.merchant.trim()
  const shopCategory = (merchant && categoryFor(merchant)) || fallbackCategory
  const lines =
    mode === 'total'
      ? [
          {
            description: merchant,
            quantity: 1,
            amount: receiptTotal(receipt, currency.maximumFractionDigits),
          },
        ].filter((line) => isPositive(line.amount))
      : receiptLines(receipt, currency.maximumFractionDigits)
  return lines.map((line) => ({
    id: newId(),
    date,
    type: 'expense',
    category:
      mode === 'total'
        ? shopCategory
        : (line.description && categoryFor(line.description)) || shopCategory,
    description: line.description,
    quantity: line.quantity,
    amount: line.amount,
    currency,
    rate,
  }))
}
