import { z } from 'zod'

import { TUserResponse } from '~/lib/types'
import { shareSchema } from '~/lib/validations'

export type TTime = {
  seconds: number
  nanoseconds: number
}

export type TShareForm = z.infer<ReturnType<typeof shareSchema>>

export type TPermissions = {
  read: string[]
  write: string[]
}

export type THandlePermission = {
  newValue: string
  uid: string
}

export type TParamsPermission = Pick<TPermissions, 'write'> &
  Pick<TUserResponse, 'uid' | 'displayName' | 'photoURL'>
