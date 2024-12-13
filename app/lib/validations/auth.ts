import { TFunction } from 'i18next'
import { z } from 'zod'

export const signInSchema = (t: TFunction) =>
  z.object({
    email: z.string().email({
      message: t('errors.invalid_string.email', {
        ns: 'zod',
        validation: t('zod:validations.email'),
      }),
    }),
    password: z.string().min(6, {
      message: t('errors.too_small.string.inclusive', {
        ns: 'zod',
        minimum: 6,
      }),
    }),
  })

export const signUpSchema = (t: TFunction) =>
  z
    .object({
      displayName: z.string().min(1, {
        message: t('errors.invalid_type_received_null', { ns: 'zod' }),
      }),
      email: z.string().email({
        message: t('errors.invalid_string.email', {
          ns: 'zod',
          validation: t('zod:validations.email'),
        }),
      }),
      password: z.string().min(6, {
        message: t('errors.too_small.string.inclusive', {
          ns: 'zod',
          minimum: 6,
        }),
      }),
      confirmPassword: z.string().min(6, {
        message: t('errors.too_small.string.inclusive', {
          ns: 'zod',
          minimum: 6,
        }),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.form.confirmPassword.errors.passwordMismatch'),
      path: ['confirmPassword'],
    })

export const emailSchema = (t: TFunction) =>
  z.object({
    email: z.string().email({
      message: t('errors.invalid_string.email', {
        ns: 'zod',
        validation: t('zod:validations.email'),
      }),
    }),
  })
