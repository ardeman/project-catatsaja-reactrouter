import { z } from 'zod'

import { noteSchema } from '~/lib/validations/note'

import { THandleSetPermission, TPermissions, TTime } from './common'

export type TNoteForm = z.infer<typeof noteSchema>

export type TCreateNoteRequest = TNoteForm

export type TUpdateNoteRequest = { id: string } & TNoteForm

export type TPinNoteRequest = { note: TNoteResponse; isPinned: boolean }

export type TNoteResponse = {
  id: string
  isPinned?: boolean
  pinnedBy?: string[]
  createdAt: TTime
  updatedAt: TTime
  owner: string
  permissions?: TPermissions
} & TNoteForm

export type TNotePermissionRequest = THandleSetPermission & {
  note: TNoteResponse
}
