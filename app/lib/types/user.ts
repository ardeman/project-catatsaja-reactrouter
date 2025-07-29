import { z } from 'zod'

import { Theme, Size } from '~/lib/contexts/theme'
import { TCurrencyFormatRequest } from '~/lib/types/settings'
import { emailSchema, signInSchema, signUpSchema } from '~/lib/validations/user'

import { TTime } from './common'

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
  defaultCurrency?: string
  numberFormat?: string
  language?: string
  theme?: Theme
  size?: Size
  currencyFormat?: TCurrencyFormatRequest
}
