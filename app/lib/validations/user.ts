import { TFunction } from 'i18next'
import { z } from 'zod'

// Reusable validation rules
export const emailValidation = (t: TFunction) =>
  z.string().email({
    message: t('zod:errors.invalid_string.email', {
      validation: t('zod:validations.email'),
    }),
  })

const passwordValidation = (t: TFunction) =>
  z.string().min(6, {
    message: t('zod:errors.too_small.string.inclusive', {
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
        message: t('zod:errors.invalid_type_received_null'),
      }),
      email: emailValidation(t),
      password: passwordValidation(t),
      confirmPassword: passwordValidation(t),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.form.confirmPassword.errors.passwordMismatch'),
      path: ['confirmPassword'],
    })

export const emailSchema = (t: TFunction) =>
  z.object({
    email: emailValidation(t),
  })
