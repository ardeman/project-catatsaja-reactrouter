import { z } from 'zod'

import { bookSchema, entrySchema } from '~/lib/validations/finance'

import { THandleSetPermission, TPermissions, TTime } from './common'

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

export type TPinFinanceRequest = {
  finance: TFinanceResponse
  isPinned: boolean
}

export type TFinanceResponse = {
  id: string
  isPinned?: boolean
  pinnedBy?: string[]
  createdAt: TTime
  updatedAt?: TTime
  owner: string
  permissions?: TPermissions
} & TFinanceForm

export type TFinancePermissionRequest = THandleSetPermission & {
  finance: TFinanceResponse
}
