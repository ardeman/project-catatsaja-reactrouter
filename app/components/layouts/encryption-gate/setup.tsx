import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, Download, Fingerprint, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import { useSetUpEncryption } from '~/lib/hooks/use-set-up-encryption'
import { useSkipEncryption } from '~/lib/hooks/use-skip-encryption'
import { toast } from '~/lib/hooks/use-toast'
import { useUpdateEncryption } from '~/lib/hooks/use-update-encryption'
import { generateRecoveryCode } from '~/lib/utils/crypto'
import { canUsePasskeys } from '~/lib/utils/passkey'
import {
  setUpPassphraseSchema,
  TSetUpPassphraseForm,
} from '~/lib/validations/encryption'

import { PassphraseInput } from './passphrase-input'

type TStep = 'passphrase' | 'recovery' | 'passkey'

// The recovery code to keep: shown in groups, with copy and download.
export const RecoveryCode = ({ code }: { code: string }) => {
  const { t } = useTranslation()
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      toast({ description: t('encryption.recovery.copied') })
    } catch {
      toast({ variant: 'destructive', description: t('errors.unknown') })
    }
  }
  const download = () => {
    const blob = new Blob(
      [`${t('encryption.recovery.fileHeading')}\n\n${code}\n`],
      { type: 'text/plain' },
    )
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'catat-saja-recovery-code.txt'
    link.click()
    URL.revokeObjectURL(link.href)
  }
  return (
    <div className="grid gap-2">
      <p
        aria-label={t('encryption.recovery.label')}
        className="rounded-lg border bg-muted/50 px-3 py-3 text-center font-mono text-base tracking-wider select-all"
      >
        {/* Breaks only between groups, never inside one. */}
        {code.split('-').map((group, index) => (
          <span key={`${group}-${index}`}>
            {index > 0 && (
              <>
                -<wbr />
              </>
            )}
            {group}
          </span>
        ))}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => void copy()}
        >
          <Copy className="size-4" />
          {t('encryption.recovery.copy')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={download}
        >
          <Download className="size-4" />
          {t('encryption.recovery.download')}
        </Button>
      </div>
    </div>
  )
}

// Turning encryption on: a passphrase, the recovery code (which must be
// confirmed as saved before anything is created), then an optional
// passkey. Used for new accounts (required) and from the settings.
export const SetupEncryption = ({
  isRequired,
  onCreated,
  onDone,
}: {
  isRequired?: boolean
  // The keys exist (the passkey step may still follow).
  onCreated?: () => void
  onDone?: () => void
}) => {
  const { t } = useTranslation(['common', 'zod'])
  const [step, setStep] = useState<TStep>('passphrase')
  const [passphrase, setPassphrase] = useState('')
  const [code] = useState(() => generateRecoveryCode())
  const [hasSaved, setHasSaved] = useState(false)
  const { mutate: setUp, isPending } = useSetUpEncryption()
  const passkeys = useUpdateEncryption()
  const skip = useSkipEncryption()
  const formMethods = useForm<TSetUpPassphraseForm>({
    resolver: zodResolver(setUpPassphraseSchema(t)),
    defaultValues: { passphrase: '', confirm: '' },
  })

  const finish = () => {
    if (onDone) onDone()
  }

  const handleCreate = async () => {
    const isDone = await setUp(passphrase, code)
    if (!isDone) return
    if (onCreated) onCreated()
    if (canUsePasskeys()) setStep('passkey')
    else finish()
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <LockKeyhole className="size-5" />
        </span>
        <div className="grid gap-1">
          <h2 className="font-semibold">
            {t(
              isRequired
                ? 'encryption.setup.titleRequired'
                : 'encryption.setup.title',
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('encryption.setup.description')}
          </p>
        </div>
      </div>

      {step === 'passphrase' && (
        <FormProvider {...formMethods}>
          <form
            className="grid gap-3"
            onSubmit={formMethods.handleSubmit((values) => {
              setPassphrase(values.passphrase)
              setStep('recovery')
            })}
          >
            <PassphraseInput
              name="passphrase"
              label={t('encryption.form.passphrase')}
              autoComplete="new-password"
              isFocused
            />
            <PassphraseInput
              name="confirm"
              label={t('encryption.form.confirm')}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              {t('encryption.setup.passphraseHint')}
            </p>
            <Button type="submit">{t('encryption.setup.next')}</Button>
          </form>
          {/* A new account may go without it for now (the setup otherwise
              comes first); it stays available in the settings. */}
          {isRequired && (
            <div className="grid gap-1 border-t pt-3 text-center">
              <Button
                type="button"
                variant="ghost"
                disabled={skip.isPending}
                onClick={() => void skip.mutate()}
              >
                {t('encryption.setup.skip')}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t('encryption.setup.skipHint')}
              </p>
            </div>
          )}
        </FormProvider>
      )}

      {step === 'recovery' && (
        <div className="grid gap-3">
          <h3 className="text-sm font-medium">
            {t('encryption.recovery.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('encryption.recovery.description')}
          </p>
          <RecoveryCode code={code} />
          <div className="flex items-start gap-2">
            <Checkbox
              id="encryption-saved"
              checked={hasSaved}
              onCheckedChange={(checked) => setHasSaved(checked === true)}
            />
            <Label
              htmlFor="encryption-saved"
              className="text-sm leading-snug font-normal"
            >
              {t('encryption.recovery.confirm')}
            </Label>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep('passphrase')}
              disabled={isPending}
            >
              {t('encryption.setup.back')}
            </Button>
            <Button
              type="button"
              disabled={!hasSaved || isPending}
              onClick={() => void handleCreate()}
            >
              {t(
                isPending
                  ? 'encryption.setup.creating'
                  : 'encryption.setup.turnOn',
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 'passkey' && (
        <div className="grid gap-3">
          <h3 className="text-sm font-medium">
            {t('encryption.passkey.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('encryption.passkey.description')}
          </p>
          {passkeys.error && (
            <p
              role="alert"
              className="text-sm text-destructive-text"
            >
              {passkeys.error}
            </p>
          )}
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={finish}
            >
              {t('encryption.passkey.skip')}
            </Button>
            <Button
              type="button"
              className="gap-1.5"
              disabled={passkeys.isPending}
              onClick={async () => {
                if (!(await passkeys.addPasskey(passphrase))) {
                  return
                }

                toast({ description: t('encryption.passkey.added') })
                finish()
              }}
            >
              <Fingerprint className="size-4" />
              {t('encryption.passkey.add')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
