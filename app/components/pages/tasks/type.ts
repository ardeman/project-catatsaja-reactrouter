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
