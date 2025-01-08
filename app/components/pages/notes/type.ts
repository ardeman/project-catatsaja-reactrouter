import { HTMLAttributes } from 'react'

import { TNoteResponse } from '~/lib/types/note'

export type TFormProps = {
  notes?: TNoteResponse[]
}

export type THandleModifyNote = {
  note: TNoteResponse
}

export type THandlePinNote = {
  isPinned: boolean
} & THandleModifyNote

export type TCardProps = {
  note: TNoteResponse
  className?: HTMLAttributes<HTMLDivElement>['className']
}

export type TNoteConfirmation = {
  kind: string
  detail: TNoteResponse
}

export type TActionProps = {
  isOwner: boolean
  isEditable?: boolean
  isPinned?: boolean
  note: TNoteResponse
  className?: HTMLAttributes<HTMLDivElement>['className']
}
