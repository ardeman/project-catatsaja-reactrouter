import { HTMLAttributes } from 'react'

import { TTaskResponse } from '~/lib/types/task'

export type THandleModifyTask = {
  task: TTaskResponse
}

export type THandlePinTask = {
  isPinned: boolean
} & THandleModifyTask

export type TTaskConfirmation = {
  kind: string
  detail: TTaskResponse
}

export type TCardProperties = {
  task: TTaskResponse
  className?: HTMLAttributes<HTMLDivElement>['className']
}
