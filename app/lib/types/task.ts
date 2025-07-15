import { z } from 'zod'

import { taskSchema } from '~/lib/validations/task'

import { THandleSetPermission, TPermissions, TTime } from './common'

export type TTaskForm = z.infer<typeof taskSchema>

export type TCreateTaskRequest = TTaskForm

export type TUpdateTaskRequest = { id: string } & TTaskForm

export type TPinTaskRequest = { task: TTaskResponse; isPinned: boolean }

export type TTaskResponse = {
  id: string
  isPinned?: boolean
  pinnedBy?: string[]
  createdAt: TTime
  updatedAt: TTime
  owner: string
  permissions?: TPermissions
} & TTaskForm

export type TTaskPermissionRequest = THandleSetPermission & {
  task: TTaskResponse
}
