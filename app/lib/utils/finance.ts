import { TFinanceEntry } from '~/lib/types/finance'

// Quantity × amount, in the entry's own currency.
export const entryTotal = (entry: TFinanceEntry) =>
  entry.quantity * entry.amount

// The entry's total in the book's currency.
export const entryBookTotal = (entry: TFinanceEntry) =>
  entryTotal(entry) * entry.rate

export const summarize = (entries: TFinanceEntry[] = []) => {
  let income = 0
  let expense = 0
  for (const entry of entries) {
    if (entry.type === 'income') income += entryBookTotal(entry)
    else expense += entryBookTotal(entry)
  }
  return { income, expense, balance: income - expense }
}

// Today in the person's own time zone, as YYYY-MM-DD.
export const today = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export const newEntryId = () => crypto.randomUUID()

// Newest first; entries on the same day keep the order they were added.
export const groupByDate = (entries: TFinanceEntry[] = []) => {
  const groups = new Map<string, TFinanceEntry[]>()
  for (const entry of entries.toReversed()) {
    groups.set(entry.date, [...(groups.get(entry.date) ?? []), entry])
  }
  return [...groups].toSorted(([a], [b]) => b.localeCompare(a))
}
