import { z } from 'zod'

import { emailSchema, signInSchema, signUpSchema } from '~/lib/validations'

export type TSignInRequest = z.infer<typeof signInSchema>

export type TSignUpRequest = z.infer<typeof signUpSchema>

export type TEmailRequest = z.infer<typeof emailSchema>
