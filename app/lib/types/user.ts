import { z } from 'zod'

import { Theme } from '~/lib/contexts/theme'
import { TTime } from '~/lib/types/common'
import { emailSchema, signInSchema, signUpSchema } from '~/lib/validations/user'

export type TSignInRequest = z.infer<ReturnType<typeof signInSchema>>

export type TSignUpRequest = z.infer<ReturnType<typeof signUpSchema>> & {
  theme: Theme
  language: string
}

export type TEmailRequest = z.infer<ReturnType<typeof emailSchema>>

export type TUserResponse = {
  uid: string
  email: string
  displayName: string
  photoURL: string
  createdAt: TTime
  updatedAt: TTime
  defaultCurrency?: string
  numberFormat?: string
  language?: string
  theme?: Theme
}
