import { z } from 'zod'

import { Theme, Size } from '~/lib/contexts/theme'
import { TTime } from '~/lib/types/common'
import { TCurrency } from '~/lib/types/settings'
import { emailSchema, signInSchema, signUpSchema } from '~/lib/validations/user'

export type TSignInRequest = z.infer<ReturnType<typeof signInSchema>>

export type TSignUpRequest = z.infer<ReturnType<typeof signUpSchema>> & {
  theme: Theme
  language: string
  size: Size
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
  currencies?: TCurrency[]
  numberFormat?: string
  language?: string
  theme?: Theme
  size?: Size
}
