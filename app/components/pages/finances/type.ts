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
  // What is on screen, or a book from the list (entries not read yet).
  finance: TFinanceForm | TFinanceResponse
}

export type TCardProperties = {
  finance: TFinanceResponse
  className?: HTMLAttributes<HTMLDivElement>['className']
}

export type TFinanceConfirmation = {
  kind: string
  detail: TFinanceResponse
}
