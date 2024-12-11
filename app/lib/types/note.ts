import { z } from 'zod'

import { TPermissions, TTime } from '~/lib/types'
import { noteSchema } from '~/lib/validations'

export type TNoteForm = z.infer<typeof noteSchema>

export type TCreateNoteRequest = TNoteForm

export type TUpdateNoteRequest = { id: string } & TNoteForm

export type TPinNoteRequest = { note: TNoteResponse; isPinned: boolean }

export type TNoteResponse = {
  id: string
  title: string
  content: string
  isPinned?: boolean
  pinnedBy?: string[]
  createdAt: TTime
  updatedAt: TTime
  owner: string
  permissions?: TPermissions
}
