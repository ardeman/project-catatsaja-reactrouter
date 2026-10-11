import { z } from 'zod'

import { noteSchema } from '~/lib/validations/note'

import { THandleSetPermission, TPermissions, TTime } from './common'

export type TNoteForm = z.infer<typeof noteSchema>

export type TCreateNoteRequest = TNoteForm

export type TUpdateNoteRequest = { id: string } & Partial<TNoteForm>

export type TPinNoteRequest = { note: TNoteResponse; isPinned: boolean }

export type TNoteResponse = {
  id: string
  isPinned?: boolean
  // Stored end-to-end encrypted (set when read, never saved).
  isEncrypted?: boolean
  pinnedBy?: string[]
  createdAt: TTime
  updatedAt: TTime
  owner: string
  permissions?: TPermissions
} & TNoteForm

export type TNotePermissionRequest = THandleSetPermission & {
  note: TNoteResponse
}
