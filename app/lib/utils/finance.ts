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
    const group = groups.get(entry.date)
    if (group) group.push(entry)
    else groups.set(entry.date, [entry])
  }
  return [...groups].toSorted(([a], [b]) => b.localeCompare(a))
}

// Entries from every book, newest first (by date, then by the order they
// were added), used to suggest categories.
export const newestFirst = (entries: TFinanceEntry[]) =>
  entries
    .map((entry, index) => ({ entry, index }))
    .toSorted(
      (a, b) => b.entry.date.localeCompare(a.entry.date) || b.index - a.index,
    )
    .map(({ entry }) => entry)

// The category last used for this type.
export const lastCategory = (
  type: TFinanceEntry['type'],
  history: TFinanceEntry[],
) => history.find((entry) => entry.type === type)?.category

const words = (text: string) =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 3)

// The most recent past entry described the same way: the same text, or
// else a shared word ("Grab ke kantor" → an earlier "Grab"). Its category
// (and type) is the suggestion.
export const suggestFromHistory = (
  description: string,
  history: TFinanceEntry[],
) => {
  const text = description.trim().toLowerCase()
  if (text.length < 2) return
  const exact = history.find(
    (entry) => entry.description.trim().toLowerCase() === text,
  )
  if (exact) return exact
  const typed = new Set(words(text))
  if (typed.size === 0) return
  return history.find((entry) =>
    words(entry.description).some((word) => typed.has(word)),
  )
}
