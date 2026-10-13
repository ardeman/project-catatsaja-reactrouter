import { LucideIcon } from 'lucide-react'
import { HTMLAttributes, ReactNode } from 'react'
import { z } from 'zod'

import { TUserResponse } from '~/lib/types/user'
import { shareSchema } from '~/lib/validations/common'

export type TTime = {
  seconds: number
  nanoseconds: number
}

export type TShareForm = z.infer<ReturnType<typeof shareSchema>>

export type THandleSetPermission = {
  permission: 'read' | 'write' | 'delete'
  // Share an encrypted item with someone who hasn't turned encryption on:
  // it is stored plain again.
  allowPlain?: boolean
} & Pick<TUserResponse, 'uid'>

export type THandleDeletePermission = Pick<TUserResponse, 'uid' | 'email'>

// Who may read and write an item, or has been invited to.
export type TAccessLists = {
  read: string[]
  write: string[]
}

export type TPermissions = {
  read: string[]
  write: string[]
  // Invited and not accepted yet (shown as invited in the share dialog).
  invited?: TAccessLists
  // 'needsPlain': encrypted, and the person hasn't turned encryption on.
  handleShare: (
    parameters: THandleSetPermission,
  ) => Promise<'shared' | 'needsPlain' | 'failed' | undefined> | void
  handleUnshare: (parameters: Pick<THandleDeletePermission, 'uid'>) => void
  path?: string
}

export type TParametersPermission = Pick<
  TUserResponse,
  'uid' | 'displayName' | 'photoURL' | 'email'
> & {
  // Unset for someone found by email who has no access yet.
  permission?: THandleSetPermission['permission']
  // Invited, and hasn't accepted yet.
  isInvited?: boolean
} & {
  handleDeletePermission: (parameters: THandleDeletePermission) => void
  handleSetPermission: (parameters: THandleSetPermission) => void
}

export type TActionProperties = {
  isOwner?: boolean
  isEditable?: boolean
  isPinned?: boolean
  // Archived by the person; with `handleArchive`, shows Archive / Restore.
  isArchived?: boolean
  handleArchive?: () => void
  className?: HTMLAttributes<HTMLDivElement>['className']
  handleDelete?: () => void
  handlePin?: () => void
  handleShare?: () => void
  handleUnlink?: () => void
  handleDuplicate?: () => void
  sharedCount?: number
  handleBack?: () => void
  isCreate?: boolean
  isLoading?: boolean
  disabled?: boolean
  handleToggleCheckAll?: () => void
  checkedAll?: boolean
  buttonClassName?: HTMLAttributes<HTMLButtonElement>['className']
  formId?: string
  // Undo and redo over the item's history (notes).
  handleUndo?: () => void
  handleRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  // More buttons (such as a menu), drawn with the bar's button style.
  extra?: (buttonClassName: string) => ReactNode
}

export type TMenu = {
  name: string
  href: string
  icon?: LucideIcon
}

// An item someone shared with the person, waiting for them to accept.
export type TInvitation = {
  name: 'notes' | 'tasks' | 'finances' | 'healthLogs'
  id: string
  owner: string
  // The item's title (a health log's name); empty when it has none.
  title: string
  access: 'read' | 'write'
  isEncrypted: boolean
}

export type TLiveSubscription<T> = (
  uid: string,
  onData: (data: T) => void,
  onError: (error: unknown) => void,
) => () => void
