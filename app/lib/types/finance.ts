import { z } from 'zod'

import {
  bookSchema,
  entrySchema,
  receiptSchema,
  transferSchema,
  typedEntriesSchema,
} from '~/lib/validations/finance'

import {
  TCardStyle,
  TAccessLists,
  THandleSetPermission,
  TPermissions,
  TTime,
} from './common'

export type TFinanceEntry = z.output<ReturnType<typeof entrySchema>>

export type TFinanceEntryForm = z.input<ReturnType<typeof entrySchema>>

export type TFinanceCurrency = TFinanceEntry['currency']

// What someone actually holds in a wallet or bank account, in the book's
// currency, to check the book's balance against. A balance not entered yet
// is null, so it stays empty instead of turning into 0 once saved.
export type TFinanceAccount = {
  id: string
  name: string
  balance: number | null
}

export type TTransferForm = z.input<ReturnType<typeof transferSchema>>

export type TTransfer = z.output<ReturnType<typeof transferSchema>>

// The person's own group of categories (such as Needs = food + bills), to
// see their total and share. A category is in one group at most.
type TCategoryGroup = {
  id: string
  name: string
  categories: string[]
}

// A monthly limit on one expense category, in the book's currency. One not
// entered yet is null, like an account's balance.
type TFinanceBudget = {
  id: string
  category: string
  limit: number | null
  // What the limit is for: each month (the default) or the whole book.
  period?: 'month' | 'book'
}

// Something to save for by a month (YYYY-MM), in the book's currency. Once
// done, it keeps what it actually cost. Amounts not entered yet are null.
type TFinanceGoal = {
  id: string
  name: string
  amount: number | null
  due: string
  done: boolean
  spent: number | null
}

// Words to look for in entries' descriptions, such as "bensin" or "grab,
// gojek" (commas separate alternatives), to see what they add up to.
type TFinanceKeyword = {
  id: string
  text: string
}

// An entry that comes back each month (salary, rent, a bill), added when
// the person confirms it: one amount in its own currency (null while not
// entered), on a day of the month, with the last month (YYYY-MM) it was
// added or skipped.
type TFinanceRecurring = {
  id: string
  type: TFinanceEntry['type']
  category: string
  description: string
  amount: number | null
  currency: TFinanceCurrency
  rate: number
  day: number
  last: string
}

// A book: a title, the currency its totals are in, its entries, the
// accounts it is checked against, its groups of categories, its budgets,
// its savings goals and the payday (a day of the month) they are saved on,
// its keywords and its recurring entries (missing on books made before
// them).
export type TFinanceForm = z.infer<typeof bookSchema> & {
  content: TFinanceEntry[]
  accounts?: TFinanceAccount[]
  categoryGroups?: TCategoryGroup[]
  budgets?: TFinanceBudget[]
  goals?: TFinanceGoal[]
  payday?: number | null
  keywords?: TFinanceKeyword[]
  recurring?: TFinanceRecurring[]
}

export type TCreateFinanceRequest = TFinanceForm

export type TUpdateFinanceRequest = { id: string } & Partial<TFinanceForm>

export type TCategoryTotal = {
  category: string
  total: number
  share: number
}

// What lists, cards, search and suggestions show of a book, stored with it
// (encrypted with its content) whenever its entries are written, so they
// don't need every entry of every book.
export type TFinanceSummary = {
  count: number
  income: number
  expense: number
  // Expenses by category, as the card's category bar.
  spending: TCategoryTotal[]
  // The newest entries by date.
  recent: TFinanceEntry[]
  // Every entry's description, each wording once, so search finds a book by
  // any of its entries. Missing on books not saved since it was added.
  descriptions?: string[]
}

export type TPinFinanceRequest = {
  finance: TFinanceResponse
  isPinned: boolean
}

export type TFinanceResponse = {
  id: string
  isPinned?: boolean
  // Stored end-to-end encrypted (set when read, never saved).
  isEncrypted?: boolean
  cardStyle?: TCardStyle
  pinnedBy?: string[]
  // Archived by the person (their own list only).
  isArchived?: boolean
  archivedBy?: string[]
  createdAt: TTime
  updatedAt?: TTime
  owner: string
  permissions?: TPermissions
  // People invited who haven't accepted yet.
  invites?: TAccessLists
  // Missing on books not saved since summaries were added.
  summary?: TFinanceSummary
  // 2 once its entries are in month documents (`finance-months.ts`); they
  // are still read into `content`.
  entryStore?: number
} & TFinanceForm

export type TFinancePermissionRequest = THandleSetPermission & {
  finance: TFinanceResponse
}

export type TReceipt = z.infer<typeof receiptSchema>

// A receipt becomes one entry for its total, or one per line.
export type TReceiptMode = 'total' | 'items'

export type TTypedEntries = z.infer<typeof typedEntriesSchema>
