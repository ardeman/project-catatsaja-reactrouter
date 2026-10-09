import { z } from 'zod'

import { itemSchema, titleSchema } from '~/lib/validations/finance'

import { THandleSetPermission, TPermissions, TTime } from './common'

type TFinanceTitleForm = z.infer<ReturnType<typeof titleSchema>>

type TFinanceItemForm = z.infer<ReturnType<typeof itemSchema>>

export type TFinanceForm = TFinanceTitleForm & { content: TFinanceItemForm[] }

export type TCreateFinanceRequest = TFinanceForm

export type TUpdateFinanceRequest = { id: string } & TFinanceForm

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
