import {
  TFinanceAccount,
  TFinanceCurrency,
  TFinanceEntry,
} from '~/lib/types/finance'
import { TCurrency } from '~/lib/types/settings'

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

// Book-currency units for 1 unit of \`code\`, from the person's own rates
// (each rate is the value of 1 unit in their default currency). 1 when the
// currencies match or a rate is missing; it can be edited either way.
export const suggestRate = (
  code: string,
  book: TFinanceCurrency,
  currencies: TCurrency[],
) => {
  if (code === book.code) return 1
  const from = currencies.find((currency) => currency.code === code)
  const to = currencies.find((currency) => currency.code === book.code)
  if (!from?.rate || !to?.rate) return 1
  return Number((from.rate / to.rate).toPrecision(8))
}
