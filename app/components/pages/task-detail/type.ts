import { TTaskForm, TTaskResponse } from '~/lib/types/task'

export type TFormProperties = {
  task?: TTaskResponse
}

export type TDragPreview = {
  source: number
  target: number
}

export type TTaskList = Omit<TTaskForm, 'item'>

export type TAiHelpersProperties = {
  // The list as it is on screen, including items still being typed.
  getList: () => TTaskList
  // Breaking down needs open items; suggesting and translating, any item.
  hasOpenItems: boolean
  hasItems: boolean
  onApply: (list: TTaskList) => void
  // The icon bar's button style.
  triggerClassName: string
}
