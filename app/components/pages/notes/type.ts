import { HTMLAttributes } from 'react'

import { TNoteResponse } from '~/lib/types/note'

export type THandleModifyNote = {
  note: TNoteResponse
}

export type THandlePinNote = {
  isPinned: boolean
} & THandleModifyNote

export type TCardProperties = {
  note: TNoteResponse
  className?: HTMLAttributes<HTMLDivElement>['className']
}

export type TNoteConfirmation = {
  kind: string
  detail: TNoteResponse
}
