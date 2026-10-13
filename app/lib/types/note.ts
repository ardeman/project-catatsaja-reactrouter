import { z } from 'zod'

import { noteHelperSchema, noteSchema } from '~/lib/validations/note'

import {
  TAccessLists,
  THandleSetPermission,
  TPermissions,
  TTime,
} from './common'

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
  // Archived by the person (their own list only).
  isArchived?: boolean
  archivedBy?: string[]
  createdAt: TTime
  updatedAt: TTime
  owner: string
  permissions?: TPermissions
  // People invited who haven't accepted yet.
  invites?: TAccessLists
} & TNoteForm

export type TNotePermissionRequest = THandleSetPermission & {
  note: TNoteResponse
}

export type TNoteHelper = 'summarise' | 'tidy' | 'translate' | 'checklist'

export type TNoteHelperResult = z.infer<typeof noteHelperSchema>
