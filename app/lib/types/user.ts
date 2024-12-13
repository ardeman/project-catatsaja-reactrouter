import { z } from 'zod'

import { TTime } from '~/lib/types'
import { emailSchema, signInSchema, signUpSchema } from '~/lib/validations'

export type TSignInRequest = z.infer<ReturnType<typeof signInSchema>>

export type TSignUpRequest = z.infer<ReturnType<typeof signUpSchema>>

export type TEmailRequest = z.infer<ReturnType<typeof emailSchema>>

export type TUserResponse = {
  uid: string
  email: string
  displayName: string
  photoURL: string
  createdAt: TTime
  updatedAt: TTime
}
