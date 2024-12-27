import { TPermissions, TTime } from './common'

export type TMoneyLogResponse = {
  id: string
  title: string
  isPinned?: boolean
  pinnedBy?: string[]
  createdAt: TTime
  updatedAt: TTime
  owner: string
  permissions?: TPermissions
}

export type TLogResponse = {
  id: string
  description: string
  amount: number
  currency: string
  rate: number
  timestamp: TTime
  type: 'income' | 'expense'
  category: string
}
