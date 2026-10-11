import { zodResolver } from '@hookform/resolvers/zod'
import { Fingerprint, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/base/input'
import { Button } from '~/components/ui/button'
import { useGetKeyring } from '~/lib/hooks/use-get-keyring'
import { useUnlockEncryption } from '~/lib/hooks/use-unlock-encryption'
import { canUsePasskeys } from '~/lib/utils/passkey'
import {
  recoverSchema,
  TRecoverForm,
  TUnlockForm,
  unlockSchema,
} from '~/lib/validations/encryption'

import { PassphraseInput } from './passphrase-input'

// This device needs the person's key: the passphrase, a passkey, or (when
// the passphrase is forgotten) the recovery code and a new passphrase.
export const Unlock = () => {
  const { t } = useTranslation(['common', 'zod'])
  const [isRecovering, setIsRecovering] = useState(false)
  const unlock = useUnlockEncryption()
  const { data: keyring } = useGetKeyring()
  const hasPasskeys = canUsePasskeys() && (keyring?.passkeys?.length ?? 0) > 0
  const unlockForm = useForm<TUnlockForm>({
    resolver: zodResolver(unlockSchema(t)),
    defaultValues: { passphrase: '' },
  })
  const recoverForm = useForm<TRecoverForm>({
    resolver: zodResolver(recoverSchema(t)),
    defaultValues: { code: '', passphrase: '', confirm: '' },
  })

  return (
    <div className="flex flex-1 items-start justify-center p-4 md:items-center md:p-8">
      <section className="glass-surface grid w-full max-w-sm gap-4 rounded-2xl border p-6">
        <div className="grid justify-items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <LockKeyhole className="size-6" />
          </span>
          <h1 className="text-lg font-semibold">
            {t('encryption.unlock.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              isRecovering
                ? 'encryption.unlock.recoverDescription'
                : 'encryption.unlock.description',
            )}
          </p>
        </div>

        {unlock.error && (
          <p
            role="alert"
            className="text-center text-sm text-destructive-text"
          >
            {unlock.error}
          </p>
        )}

        {isRecovering ? (
          <FormProvider {...recoverForm}>
            <form
              className="grid gap-3"
              onSubmit={recoverForm.handleSubmit((values) =>
                unlock.withRecoveryCode(values.code, values.passphrase),
              )}
            >
              <Input
                name="code"
                label={t('encryption.recovery.label')}
                autoComplete="off"
                autoFocus // eslint-disable-line jsx-a11y/no-autofocus -- the form's first field
                inputClassName="font-mono uppercase"
                required
              />
              <PassphraseInput
                name="passphrase"
                label={t('encryption.form.newPassphrase')}
                autoComplete="new-password"
              />
              <PassphraseInput
                name="confirm"
                label={t('encryption.form.confirm')}
                autoComplete="new-password"
              />
              <Button
                type="submit"
                disabled={unlock.isPending}
              >
                {t('encryption.unlock.recover')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsRecovering(false)}
              >
                {t('encryption.unlock.back')}
              </Button>
            </form>
          </FormProvider>
        ) : (
          <FormProvider {...unlockForm}>
            <form
              className="grid gap-3"
              onSubmit={unlockForm.handleSubmit((values) =>
                unlock.withPassphrase(values.passphrase),
              )}
            >
              <PassphraseInput
                name="passphrase"
                label={t('encryption.form.passphrase')}
                autoComplete="current-password"
                isFocused={!hasPasskeys}
              />
              <Button
                type="submit"
                disabled={unlock.isPending}
              >
                {t('encryption.unlock.submit')}
              </Button>
              {hasPasskeys && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5"
                  disabled={unlock.isPending}
                  onClick={() => void unlock.withPasskey()}
                >
                  <Fingerprint className="size-4" />
                  {t('encryption.unlock.passkey')}
                </Button>
              )}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={() => setIsRecovering(true)}
              >
                {t('encryption.unlock.forgot')}
              </Button>
            </form>
          </FormProvider>
        )}
      </section>
    </div>
  )
}
