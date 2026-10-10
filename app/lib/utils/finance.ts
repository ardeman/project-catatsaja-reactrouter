import { TFinanceAccount, TFinanceEntry } from '~/lib/types/finance'

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

// Balances arrive as typed text ("1234.5") until saved as numbers; one left
// empty is saved as null.
export const normalizeAccounts = (accounts: TFinanceAccount[] = []) =>
  accounts.map((account) => {
    const text = String(account.balance ?? '')
    const balance = Number(text)
    return {
      ...account,
      balance: text === '' || Number.isNaN(balance) ? null : balance,
    }
  })

export const sumAccounts = (accounts: TFinanceAccount[] = []) =>
  accounts.reduce((total, account) => total + (Number(account.balance) || 0), 0)

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

// The past entry described most like this one: the same text, or else the
// most words in common, with the first word counting extra ("Cicilan …"
// and "Gaji …" say what an entry is; a bank or place name says little).
// Ties go to the most recent. `isStrong` when it is the same text, two or
// more shared words or the same first word: only then may it change the
// type (income or expense), not just the category.
export const suggestFromHistory = (
  description: string,
  history: TFinanceEntry[],
) => {
  const text = description.trim().toLowerCase()
  if (text.length < 2) return
  const exact = history.find(
    (entry) => entry.description.trim().toLowerCase() === text,
  )
  if (exact) return { entry: exact, isStrong: true }
  const typedWords = words(text)
  const typed = new Set(typedWords)
  if (typed.size === 0) return
  let best: { entry: TFinanceEntry; score: number } | undefined
  for (const entry of history) {
    const theirs = words(entry.description)
    const shared = new Set(theirs.filter((word) => typed.has(word))).size
    if (shared === 0) continue
    const sameFirst = theirs[0] === typedWords[0]
    const score = shared + (sameFirst ? 1 : 0)
    if (!best || score > best.score) best = { entry, score }
  }
  if (!best) return
  return { entry: best.entry, isStrong: best.score >= 2 }
}
