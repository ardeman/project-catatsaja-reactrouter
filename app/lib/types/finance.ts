import { z } from 'zod'

import { financeSchema } from '~/lib/validations/finance'

import { THandleSetPermission, TPermissions, TTime } from './common'

export type TFinanceForm = z.infer<ReturnType<typeof financeSchema>>

export type TCreateFinanceRequest = Omit<TFinanceForm, 'item'>

export type TUpdateFinanceRequest = { id: string } & Omit<TFinanceForm, 'item'>

export type TPinFinanceRequest = {
  finance: TFinanceResponse
  isPinned: boolean
}

export type TFinanceResponse = {
  id: string
  isPinned?: boolean
  pinnedBy?: string[]
  createdAt: TTime
  updatedAt: TTime
  owner: string
  permissions?: TPermissions
} & TFinanceForm

export type TFinancePermissionRequest = THandleSetPermission & {
  finance: TFinanceResponse
}
