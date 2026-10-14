import { TTaskResponse } from '~/lib/types/task'

export type TFormProperties = {
  task?: TTaskResponse
}

export type TDragPreview = {
  source: number
  target: number
}
