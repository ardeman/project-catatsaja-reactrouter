import { z } from 'zod'

import { taskSchema } from '~/lib/validations/task'

import {
  TAccessLists,
  THandleSetPermission,
  TPermissions,
  TTime,
} from './common'

export type TTaskForm = z.infer<ReturnType<typeof taskSchema>>

export type TCreateTaskRequest = Omit<TTaskForm, 'item'>

export type TUpdateTaskRequest = { id: string } & Partial<
  Omit<TTaskForm, 'item'>
>

export type TPinTaskRequest = { task: TTaskResponse; isPinned: boolean }

export type TTaskResponse = {
  id: string
  isPinned?: boolean
  // Stored end-to-end encrypted (set when read, never saved).
  isEncrypted?: boolean
  pinnedBy?: string[]
  // Archived by the person (their own list only).
  isArchived?: boolean
  archivedBy?: string[]
  createdAt: TTime
  updatedAt: TTime
  owner: string
  permissions?: TPermissions
  // People invited who haven't accepted yet.
  invites?: TAccessLists
} & TTaskForm

export type TTaskPermissionRequest = THandleSetPermission & {
  task: TTaskResponse
}
