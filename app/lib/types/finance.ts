import { z } from 'zod'

import {
  bookSchema,
  entrySchema,
  receiptSchema,
  typedEntriesSchema,
} from '~/lib/validations/finance'

import {
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

// A book: a title, the currency its totals are in, its entries and the
// accounts it is checked against (missing on books made before them).
export type TFinanceForm = z.infer<typeof bookSchema> & {
  content: TFinanceEntry[]
  accounts?: TFinanceAccount[]
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
} & TFinanceForm

export type TFinancePermissionRequest = THandleSetPermission & {
  finance: TFinanceResponse
}

export type TReceipt = z.infer<typeof receiptSchema>

// A receipt becomes one entry for its total, or one per line.
export type TReceiptMode = 'total' | 'items'

export type TTypedEntries = z.infer<typeof typedEntriesSchema>
