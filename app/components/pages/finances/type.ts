import { HTMLAttributes } from 'react'

import { TFinanceForm, TFinanceResponse } from '~/lib/types/finance'

export type THandleModifyFinance = {
  finance: TFinanceResponse
}

export type THandlePinFinance = {
  isPinned: boolean
} & THandleModifyFinance

// Any book content: a stored book, or the detail form's current values.
export type THandleDuplicateFinance = {
  finance: TFinanceForm
}

export type TCardProperties = {
  finance: TFinanceResponse
  className?: HTMLAttributes<HTMLDivElement>['className']
}

export type TFinanceConfirmation = {
  kind: string
  detail: TFinanceResponse
}
