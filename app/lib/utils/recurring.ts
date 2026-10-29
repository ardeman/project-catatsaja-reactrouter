// A book's recurring entries (salary, rent, bills): an entry that comes back
// on a day of each month and is added only once the person confirms it. When
// each is due is computed in the browser; only the entries and the last month
// each was added or skipped are stored. No app imports, so `pnpm test:unit`
// can run it.

type TCurrencyLike = {
  code: string
  symbol: string
  maximumFractionDigits: number
}

type TEntryLike = {
  id: string
  date: string
  type: 'income' | 'expense'
  category: string
  description: string
  quantity: number
  amount: number
  currency: TCurrencyLike
  rate: number
}

type TRecurring = {
  id: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number | null
  currency: TCurrencyLike
  rate: number
  day: number
  last: string
}

export type TDueRecurring<T extends TRecurring = TRecurring> = {
  recurring: T
  // The day it is due (YYYY-MM-DD).
  date: string
}

// The month (YYYY-MM) `count` months after another.
const addMonths = (month: string, count: number) => {
  const [year, index] = month.split('-').map(Number)
  const total = year * 12 + (index - 1) + count
  const next = String((total % 12) + 1).padStart(2, '0')
  return `${Math.floor(total / 12)}-${next}`
}

// The day a recurring entry falls on in a month: past the month's end (the
// 31st in November), its last day.
export const dueDate = (month: string, day: number) => {
  const [year, index] = month.split('-').map(Number)
  const last = new Date(Date.UTC(year, index, 0)).getUTCDate()
  return `${month}-${String(Math.min(day, last)).padStart(2, '0')}`
}

// When a recurring entry is next due: in the month after the last one added
// or skipped.
export const nextDue = (recurring: Pick<TRecurring, 'day' | 'last'>) =>
  dueDate(addMonths(recurring.last, 1), recurring.day)

// The recurring entries due on or before a day (YYYY-MM-DD), the oldest
// first. One left unconfirmed for months shows its oldest month; the next
// comes once that one is added or skipped.
export const dueRecurring = <T extends TRecurring>(
  recurring: T[] = [],
  today: string,
): TDueRecurring<T>[] =>
  recurring
    .map((item) => ({ recurring: item, date: nextDue(item) }))
    .filter(({ date }) => date <= today)
    .toSorted((a, b) => a.date.localeCompare(b.date))

// The one due next after a day, to show when nothing is due yet.
export const upcomingRecurring = <T extends TRecurring>(
  recurring: T[] = [],
  today: string,
): TDueRecurring<T> | undefined =>
  recurring
    .map((item) => ({ recurring: item, date: nextDue(item) }))
    .filter(({ date }) => date > today)
    .toSorted((a, b) => a.date.localeCompare(b.date))[0]

// An entry made to repeat each month: its total as one amount, on its day of
// the month, with its own month counted as added.
export const recurringFromEntry = (entry: TEntryLike, id: string) => ({
  id,
  type: entry.type,
  category: entry.category,
  description: entry.description,
  amount: entry.quantity * entry.amount,
  currency: entry.currency,
  rate: entry.rate,
  day: Number(entry.date.slice(8, 10)),
  last: entry.date.slice(0, 7),
})

// The entry a confirmed recurring entry adds, on the day it was due.
export const entryFromRecurring = (
  recurring: TRecurring,
  date: string,
  id: string,
) => ({
  id,
  date,
  type: recurring.type,
  category: recurring.category,
  description: recurring.description,
  quantity: 1,
  amount: Number(recurring.amount),
  currency: recurring.currency,
  rate: recurring.rate,
})

// Amounts arrive as typed text ("1500000") until saved as numbers; one left
// empty is saved as null. The day is a whole day of a month.
export const normalizeRecurring = <T extends TRecurring>(
  recurring: T[] = [],
): T[] =>
  recurring.map((item) => {
    const text = String(item.amount ?? '')
    const amount = Number(text)
    const day = Math.trunc(Number(item.day))
    return {
      ...item,
      amount: text === '' || Number.isNaN(amount) ? null : amount,
      day: Number.isNaN(day) ? 1 : Math.min(31, Math.max(1, day)),
    }
  })
