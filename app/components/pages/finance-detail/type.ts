import { HTMLAttributes } from 'react'

import { TFinanceResponse } from '~/lib/types/finance'

export type THandleModifyFinance = {
  finance: TFinanceResponse
}

export type THandlePinFinance = {
  isPinned: boolean
} & THandleModifyFinance

export type TFinanceConfirmation = {
  kind: string
  detail: TFinanceResponse
}

export type TCardProperties = {
  finance: TFinanceResponse
  className?: HTMLAttributes<HTMLDivElement>['className']
}
