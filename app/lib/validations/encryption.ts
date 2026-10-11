import { TFunction } from 'i18next'
import { z } from 'zod'

// A passphrase protects every encrypted item, so it needs some length.
const PASSPHRASE_MINIMUM = 10

const newPassphrase = (t: TFunction) =>
  z.string().min(PASSPHRASE_MINIMUM, {
    error: t('zod:errors.too_small.string.inclusive', {
      minimum: PASSPHRASE_MINIMUM,
    }),
  })

const required = (t: TFunction) =>
  z.string().min(1, { error: t('zod:errors.invalid_type_received_null') })

const matching = <T extends { passphrase: string; confirm: string }>(
  t: TFunction,
) => ({
  check: (data: T) => data.passphrase === data.confirm,
  issue: {
    error: t('encryption.form.mismatch'),
    path: ['confirm'],
  },
})

export const setUpPassphraseSchema = (t: TFunction) => {
  const rule = matching<{ passphrase: string; confirm: string }>(t)
  return z
    .object({ passphrase: newPassphrase(t), confirm: z.string() })
    .refine(rule.check, rule.issue)
}

export const unlockSchema = (t: TFunction) =>
  z.object({ passphrase: required(t) })

export const recoverSchema = (t: TFunction) => {
  const rule = matching<{ code: string; passphrase: string; confirm: string }>(
    t,
  )
  return z
    .object({
      code: required(t),
      passphrase: newPassphrase(t),
      confirm: z.string(),
    })
    .refine(rule.check, rule.issue)
}

export const changePassphraseSchema = (t: TFunction) => {
  const rule = matching<{
    current: string
    passphrase: string
    confirm: string
  }>(t)
  return z
    .object({
      current: required(t),
      passphrase: newPassphrase(t),
      confirm: z.string(),
    })
    .refine(rule.check, rule.issue)
}

export type TSetUpPassphraseForm = z.infer<
  ReturnType<typeof setUpPassphraseSchema>
>
export type TUnlockForm = z.infer<ReturnType<typeof unlockSchema>>
export type TRecoverForm = z.infer<ReturnType<typeof recoverSchema>>
export type TChangePassphraseForm = z.infer<
  ReturnType<typeof changePassphraseSchema>
>
