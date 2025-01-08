import { HTMLAttributes } from 'react'
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
} & Pick<TUserResponse, 'uid'>

export type THandleDeletePermission = Pick<TUserResponse, 'uid' | 'email'>

export type TPermissions = {
  read: string[]
  write: string[]
  handleShare: (parameters: THandleSetPermission) => void
  handleUnshare: (parameters: Pick<THandleDeletePermission, 'uid'>) => void
}

export type TParametersPermission = Pick<TPermissions, 'write'> &
  Pick<TUserResponse, 'uid' | 'displayName' | 'photoURL' | 'email'> & {
    handleDeletePermission: (parameters: THandleDeletePermission) => void
    handleSetPermission: (parameters: THandleSetPermission) => void
  }

export type TActionProperties = {
  isOwner: boolean
  isEditable?: boolean
  isPinned?: boolean
  className?: HTMLAttributes<HTMLDivElement>['className']
  handleDelete: () => void
  handlePin: () => void
  handleShare: () => void
  handleUnlink: () => void
  sharedCount: number
}
