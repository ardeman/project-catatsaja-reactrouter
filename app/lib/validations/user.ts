import { TFunction } from 'i18next'
import { z } from 'zod'

const emailValidation = (t: TFunction) =>
  z.email({
    error: t('zod:errors.invalid_string.email', {
      validation: t('zod:validations.email'),
    }),
  })

const passwordValidation = (t: TFunction) =>
  z.string().min(6, {
    error: t('zod:errors.too_small.string.inclusive', {
      minimum: 6,
    }),
  })

export const signInSchema = (t: TFunction) =>
  z.object({
    email: emailValidation(t),
    password: passwordValidation(t),
  })

export const signUpSchema = (t: TFunction) =>
  z
    .object({
      displayName: z.string().min(1, {
        error: t('zod:errors.invalid_type_received_null'),
      }),
      email: emailValidation(t),
      password: passwordValidation(t),
      confirmPassword: passwordValidation(t),
      language: z.string(),
      theme: z.enum(['light', 'dark', 'system'] as const),
      size: z.enum(['small', 'medium', 'large'] as const),
    })
    .refine((data) => data.password === data.confirmPassword, {
      error: t('auth.validation.confirmPassword.passwordMismatch'),
      path: ['confirmPassword'],
    })

export const emailSchema = (t: TFunction) =>
  z.object({
    email: emailValidation(t),
  })
