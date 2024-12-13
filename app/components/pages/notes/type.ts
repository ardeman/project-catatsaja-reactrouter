import { HTMLAttributes, MouseEvent } from 'react'

import { TNoteResponse } from '~/lib/types'

export type TFormProps = {
  notes?: TNoteResponse[]
}

export type THandleModifyNote = {
  event: MouseEvent<HTMLButtonElement>
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
