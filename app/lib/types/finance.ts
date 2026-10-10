import { z } from 'zod'

import { bookSchema, entrySchema } from '~/lib/validations/finance'

import { THandleSetPermission, TPermissions, TTime } from './common'

export type TFinanceEntry = z.output<ReturnType<typeof entrySchema>>

export type TFinanceEntryForm = z.input<ReturnType<typeof entrySchema>>

export type TFinanceCurrency = TFinanceEntry['currency']

// A book: a title, the currency its totals are in, and its entries.
export type TFinanceForm = z.infer<typeof bookSchema> & {
  content: TFinanceEntry[]
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
