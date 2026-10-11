import { zodResolver } from '@hookform/resolvers/zod'
import {
  Fingerprint,
  KeyRound,
  Lock,
  LockKeyhole,
  RefreshCw,
} from 'lucide-react'
import { ReactNode, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/base/card'
import { Input } from '~/components/base/input'
import { Modal } from '~/components/base/modal'
import {
  RecoveryCode,
  SetupEncryption,
} from '~/components/layouts/encryption-gate'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import { useGetKeyring } from '~/lib/hooks/use-get-keyring'
import { useUserData } from '~/lib/hooks/use-get-user'
import { toast } from '~/lib/hooks/use-toast'
import { useUpdateEncryption } from '~/lib/hooks/use-update-encryption'
import { generateRecoveryCode } from '~/lib/utils/crypto'
import { canUsePasskeys } from '~/lib/utils/passkey'
import {
  changePassphraseSchema,
  TChangePassphraseForm,
  TUnlockForm,
  unlockSchema,
} from '~/lib/validations/encryption'

type TDialog = 'setup' | 'passphrase' | 'recovery' | 'passkey' | undefined

const Action = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Lock
  label: string
  onClick: () => void
}) => (
  <Button
    type="button"
    variant="outline"
    className="justify-start gap-2"
    onClick={onClick}
  >
    <Icon className="size-4" />
    {label}
  </Button>
)

// A passphrase field for confirming an action (no show/hide needed here:
// one field, typed once).
const PassphraseCheck = ({ children }: { children?: ReactNode }) => {
  const { t } = useTranslation()
  return (
    <>
      <Input
        name="passphrase"
        type="password"
        label={t('encryption.form.passphrase')}
        autoComplete="current-password"
        required
      />
      {children}
    </>
  )
}

// End-to-end encryption: turning it on, or managing the passphrase,
// recovery code, passkeys and this device's unlocked key.
export const Security = () => {
  const { t } = useTranslation(['common', 'zod'])
  const { data: userData } = useUserData()
  const [dialog, setDialog] = useState<TDialog>()
  const [reloadKeyring, setReloadKeyring] = useState(0)
  const { data: keyring } = useGetKeyring(reloadKeyring)
  const update = useUpdateEncryption()
  const hasKeys = !!userData?.publicKey
  const passkeyCount = keyring?.passkeys?.length ?? 0
  const [newCode, setNewCode] = useState(() => generateRecoveryCode())
  const [hasSavedCode, setHasSavedCode] = useState(false)
  const passphraseForm = useForm<TChangePassphraseForm>({
    resolver: zodResolver(changePassphraseSchema(t)),
    defaultValues: { current: '', passphrase: '', confirm: '' },
  })
  const checkForm = useForm<TUnlockForm>({
    resolver: zodResolver(unlockSchema(t)),
    defaultValues: { passphrase: '' },
  })

  const close = () => {
    setDialog(undefined)
    update.clearError()
    passphraseForm.reset()
    checkForm.reset()
    setHasSavedCode(false)
  }

  const open = (next: TDialog) => {
    close()
    if (next === 'recovery') setNewCode(generateRecoveryCode())
    setDialog(next)
  }

  const error = update.error && (
    <p
      role="alert"
      className="text-sm text-destructive-text"
    >
      {update.error}
    </p>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LockKeyhole className="size-5 text-primary" />
          {t('encryption.settings.title')}
        </CardTitle>
        <CardDescription>
          {t(
            hasKeys
              ? 'encryption.settings.on'
              : 'encryption.settings.description',
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {hasKeys ? (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              <Action
                icon={KeyRound}
                label={t('encryption.settings.changePassphrase')}
                onClick={() => open('passphrase')}
              />
              <Action
                icon={RefreshCw}
                label={t('encryption.settings.newRecoveryCode')}
                onClick={() => open('recovery')}
              />
              {canUsePasskeys() && (
                <Action
                  icon={Fingerprint}
                  label={t('encryption.passkey.add')}
                  onClick={() => open('passkey')}
                />
              )}
              <Action
                icon={Lock}
                label={t('encryption.settings.lock')}
                onClick={() => void update.lock()}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('encryption.settings.passkeys', { count: passkeyCount })}
              {passkeyCount > 0 && (
                <>
                  {' · '}
                  <button
                    type="button"
                    className="underline underline-offset-4"
                    onClick={async () => {
                      if (await update.removePasskeys())
                        setReloadKeyring((value) => value + 1)
                    }}
                  >
                    {t('encryption.settings.removePasskeys')}
                  </button>
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('encryption.settings.sharedNote')}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {t('encryption.settings.howItWorks')}
            </p>
            <Button
              type="button"
              className="w-fit gap-2"
              onClick={() => open('setup')}
            >
              <LockKeyhole className="size-4" />
              {t('encryption.settings.turnOn')}
            </Button>
          </>
        )}
      </CardContent>

      <Modal
        open={dialog === 'setup'}
        setOpen={(value) => (value ? setDialog('setup') : close())}
      >
        <SetupEncryption onDone={close} />
      </Modal>

      <Modal
        open={dialog === 'passphrase'}
        setOpen={(value) => (value ? setDialog('passphrase') : close())}
        title={t('encryption.settings.changePassphrase')}
      >
        <FormProvider {...passphraseForm}>
          <form
            className="grid gap-3"
            onSubmit={passphraseForm.handleSubmit(async (values) => {
              if (
                await update.changePassphrase(values.current, values.passphrase)
              ) {
                toast({
                  description: t('encryption.settings.passphraseChanged'),
                })
                close()
              }
            })}
          >
            <Input
              name="current"
              type="password"
              label={t('encryption.form.currentPassphrase')}
              autoComplete="current-password"
              required
            />
            <Input
              name="passphrase"
              type="password"
              label={t('encryption.form.newPassphrase')}
              autoComplete="new-password"
              required
            />
            <Input
              name="confirm"
              type="password"
              label={t('encryption.form.confirm')}
              autoComplete="new-password"
              required
            />
            {error}
            <Button
              type="submit"
              disabled={update.isPending}
            >
              {t('actions.save')}
            </Button>
          </form>
        </FormProvider>
      </Modal>

      <Modal
        open={dialog === 'recovery'}
        setOpen={(value) => (value ? setDialog('recovery') : close())}
        title={t('encryption.settings.newRecoveryCode')}
      >
        <FormProvider {...checkForm}>
          <form
            className="grid gap-3"
            onSubmit={checkForm.handleSubmit(async (values) => {
              if (
                await update.replaceRecoveryCode(values.passphrase, newCode)
              ) {
                toast({
                  description: t('encryption.settings.recoveryReplaced'),
                })
                close()
              }
            })}
          >
            <p className="text-sm text-muted-foreground">
              {t('encryption.settings.recoveryDescription')}
            </p>
            <RecoveryCode code={newCode} />
            <div className="flex items-start gap-2">
              <Checkbox
                id="encryption-new-code-saved"
                checked={hasSavedCode}
                onCheckedChange={(checked) => setHasSavedCode(checked === true)}
              />
              <Label
                htmlFor="encryption-new-code-saved"
                className="text-sm leading-snug font-normal"
              >
                {t('encryption.recovery.confirm')}
              </Label>
            </div>
            <PassphraseCheck />
            {error}
            <Button
              type="submit"
              disabled={!hasSavedCode || update.isPending}
            >
              {t('encryption.settings.useNewCode')}
            </Button>
          </form>
        </FormProvider>
      </Modal>

      <Modal
        open={dialog === 'passkey'}
        setOpen={(value) => (value ? setDialog('passkey') : close())}
        title={t('encryption.passkey.add')}
      >
        <FormProvider {...checkForm}>
          <form
            className="grid gap-3"
            onSubmit={checkForm.handleSubmit(async (values) => {
              if (await update.addPasskey(values.passphrase)) {
                toast({ description: t('encryption.passkey.added') })
                setReloadKeyring((value) => value + 1)
                close()
              }
            })}
          >
            <p className="text-sm text-muted-foreground">
              {t('encryption.passkey.description')}
            </p>
            <PassphraseCheck />
            {error}
            <Button
              type="submit"
              className="gap-1.5"
              disabled={update.isPending}
            >
              <Fingerprint className="size-4" />
              {t('encryption.passkey.add')}
            </Button>
          </form>
        </FormProvider>
      </Modal>
    </Card>
  )
}
