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
  handleShare: (params: THandleSetPermission) => void
  handleUnshare: (params: Pick<THandleDeletePermission, 'uid'>) => void
}

export type TParamsPermission = Pick<TPermissions, 'write'> &
  Pick<TUserResponse, 'uid' | 'displayName' | 'photoURL' | 'email'> & {
    handleDeletePermission: (params: THandleDeletePermission) => void
    handleSetPermission: (params: THandleSetPermission) => void
  }

export type TActionProps = {
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
