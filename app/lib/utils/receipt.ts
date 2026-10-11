// Turns what Gemini read (a receipt photo, or text someone typed) into
// finance entries. Pure logic, no app imports, so it can be tested on its
// own (tests/receipt.test.mjs): the caller passes the currency, its rate
// and how to pick a category.

type TReceiptLine = {
  description: string
  quantity: number
  // The price of one, after discounts.
  amount: number
  // How much less the line costs than its printed price (its own discount
  // and its share of one on the whole bill), to show while checking.
  discount: number
}

type TReceipt = {
  merchant: string
  date: string
  currency: string
  items: {
    description: string
    quantity: number
    unitPrice: number
    // A discount printed for this line, as a positive number for the line.
    discount: number
  }[]
  charges: { description: string; amount: number }[]
  discount: number
  total: number
}

type TCurrency = { code: string; symbol: string; maximumFractionDigits: number }

type TType = 'income' | 'expense'

type TEntry = {
  id: string
  date: string
  type: TType
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

const isRealDay = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const parsed = new Date(`${date}T00:00:00Z`)
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  )
}

const daysBetween = (from: string, to: string) =>
  (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000

// Older than this, a receipt's date is worth a second look.
const OLD_AFTER_DAYS = 31

export type TReceiptDateIssue =
  'missing' | 'unreadable' | 'future' | 'swapped' | 'old'

// The date to use for a receipt (YYYY-MM-DD; dates are compared as text),
// and why it is worth checking, if it is. A future date that is a past one
// with day and month swapped (12/10 read as 10 December) is taken as that
// past date; other unusable dates become `today`.
export const receiptDate = (
  read: string,
  today: string,
): { date: string; issue?: TReceiptDateIssue } => {
  if (!read.trim()) return { date: today, issue: 'missing' }
  if (!isRealDay(read)) return { date: today, issue: 'unreadable' }
  if (read > today) {
    const [year, month, day] = read.split('-', 3)
    const swapped = `${year}-${day}-${month}`
    return isRealDay(swapped) && swapped <= today
      ? { date: swapped, issue: 'swapped' }
      : { date: today, issue: 'future' }
  }
  return daysBetween(read, today) > OLD_AFTER_DAYS
    ? { date: read, issue: 'old' }
    : { date: read }
}

// Its lines: items, each with its own discount taken off and a discount on
// the whole bill spread over them by price, then charges such as tax. Lines
// without a positive price are left out.
export const receiptLines = (
  receipt: TReceipt,
  fractionDigits: number,
): TReceiptLine[] => {
  const items = receipt.items
    .map((item) => {
      const quantity = isPositive(item.quantity) ? item.quantity : 1
      const printed = quantity * item.unitPrice
      const discount = isPositive(item.discount)
        ? Math.min(item.discount, printed)
        : 0
      return {
        description: item.description.trim(),
        quantity,
        printed,
        // What the line costs after its own discount.
        cost: printed - discount,
      }
    })
    .filter((item) => isPositive(item.cost))
  const subtotal = items.reduce((sum, item) => sum + item.cost, 0)
  const billDiscount = isPositive(receipt.discount)
    ? Math.min(receipt.discount, subtotal)
    : 0
  const factor = subtotal > 0 ? 1 - billDiscount / subtotal : 1
  const discounted = items.map((item) => ({
    ...item,
    amount: round((item.cost * factor) / item.quantity, fractionDigits),
  }))
  // Rounding each price can leave the items a little off what was paid for
  // them; the most expensive single item takes up the difference.
  const leftover = round(
    subtotal -
      billDiscount -
      discounted.reduce((sum, item) => sum + item.quantity * item.amount, 0),
    fractionDigits,
  )
  const single = discounted
    .filter((item) => item.quantity === 1)
    .toSorted((a, b) => b.amount - a.amount)[0]
  if (single && leftover !== 0)
    single.amount = round(single.amount + leftover, fractionDigits)
  const charges = receipt.charges
    .filter((charge) => isPositive(charge.amount))
    .map((charge) => ({
      description: charge.description.trim(),
      quantity: 1,
      amount: round(charge.amount, fractionDigits),
      discount: 0,
    }))
  return [
    ...discounted.map(({ description, quantity, amount, printed }) => ({
      description,
      quantity,
      amount,
      discount: round(printed - quantity * amount, fractionDigits),
    })),
    ...charges,
  ].filter((line) => isPositive(line.amount))
}

// All the discounts on the receipt: on its lines and on the whole bill.
export const receiptDiscount = (receipt: TReceipt, fractionDigits: number) =>
  round(
    receipt.items.reduce(
      (sum, item) => sum + (isPositive(item.discount) ? item.discount : 0),
      0,
    ) + (isPositive(receipt.discount) ? receipt.discount : 0),
    fractionDigits,
  )

// What the receipt adds up to: its printed total, or the sum of its lines
// when the total couldn't be read.
export const receiptTotal = (receipt: TReceipt, fractionDigits: number) =>
  round(
    isPositive(receipt.total)
      ? receipt.total
      : receiptLines(receipt, fractionDigits).reduce(
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

type TTyped = {
  entries: {
    description: string
    type: TType
    quantity: number
    unitPrice: number
    date: string
  }[]
}

// Entries from typed text, one per thing paid or received, with each
// entry's date checked like a receipt's (`receiptDate`) and why it is worth
// a look, if it is. Entries without a positive price are left out.
export const typedToEntries = ({
  typed,
  today,
  currency,
  rate,
  categoryFor,
  fallbackCategory,
  newId,
}: {
  typed: TTyped
  today: string
  currency: TCurrency
  rate: number
  categoryFor: (description: string, type: TType) => string | undefined
  fallbackCategory: (type: TType) => string
  newId: () => string
}): { entry: TEntry; dateIssue?: TReceiptDateIssue }[] =>
  typed.entries
    .filter(
      (item) =>
        isPositive(item.unitPrice) &&
        (item.type === 'income' || item.type === 'expense'),
    )
    .map((item) => {
      const description = item.description.trim()
      const { date, issue } = receiptDate(item.date, today)
      return {
        entry: {
          id: newId(),
          date,
          type: item.type,
          category:
            (description && categoryFor(description, item.type)) ||
            fallbackCategory(item.type),
          description,
          quantity: isPositive(item.quantity) ? item.quantity : 1,
          amount: round(item.unitPrice, currency.maximumFractionDigits),
          currency,
          rate,
        },
        // A missing day just means today when typing.
        dateIssue: issue === 'missing' ? undefined : issue,
      }
    })
