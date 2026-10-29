import { zodResolver } from '@hookform/resolvers/zod'
import {
  Fingerprint,
  KeyRound,
  Lock,
  LockKeyhole,
  LockKeyholeOpen,
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
import { useEncryptionSession } from '~/lib/hooks/use-encryption-session'
import { useGetKeyring } from '~/lib/hooks/use-get-keyring'
import { useUserData } from '~/lib/hooks/use-get-user'
import { toast } from '~/lib/hooks/use-toast'
import { useTurnOffEncryption } from '~/lib/hooks/use-turn-off-encryption'
import { useUnreadableShared } from '~/lib/hooks/use-unreadable-shared'
import { useUpdateEncryption } from '~/lib/hooks/use-update-encryption'
import { generateRecoveryCode } from '~/lib/utils/crypto'
import { canUsePasskeys } from '~/lib/utils/passkey'
import {
  changePassphraseSchema,
  resetPassphraseSchema,
  signInAgainSchema,
  TChangePassphraseForm,
  TResetPassphraseForm,
  TSignInAgainForm,
  TUnlockForm,
  unlockSchema,
} from '~/lib/validations/encryption'

type TDialog =
  | 'setup'
  | 'passphrase'
  | 'recovery'
  | 'reset'
  | 'passkey'
  | 'removePasskeys'
  | 'off'
  | undefined

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

// Signing in to the account again before a change that someone holding an
// unlocked device shouldn't make alone: the password, or Google's popup.
const SignInAgain = ({
  update,
}: {
  update: ReturnType<typeof useUpdateEncryption>
}) => {
  const { t } = useTranslation()
  if (update.needsPassword)
    return (
      <Input
        name="password"
        type="password"
        label={t('encryption.settings.accountPassword')}
        autoComplete="current-password"
        required
      />
    )
  return (
    <div className="grid gap-2">
      <p className="text-sm text-muted-foreground">
        {t('encryption.settings.signInAgainHint')}
      </p>
      {update.hasSignedInAgain ? (
        <p className="text-sm">{t('encryption.settings.signedInAgain')}</p>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={update.isPending}
          onClick={() => void update.signInAgain()}
        >
          {t('encryption.settings.signInAgain')}
        </Button>
      )}
    </div>
  )
}

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
  const turnOff = useTurnOffEncryption()
  const session = useEncryptionSession()
  const hasKeys = !!userData?.publicKey
  const unreadable = useUnreadableShared(
    hasKeys && session.status === 'unlocked',
  )
  const [fromOthers, setFromOthers] = useState<number>()
  const passkeyCount = keyring?.passkeys?.length ?? 0
  const [newCode, setNewCode] = useState(() => generateRecoveryCode())
  const [hasSavedCode, setHasSavedCode] = useState(false)
  const passphraseForm = useForm<TChangePassphraseForm>({
    resolver: zodResolver(changePassphraseSchema(t)),
    defaultValues: { current: '', passphrase: '', confirm: '' },
  })
  const resetForm = useForm<TResetPassphraseForm>({
    resolver: zodResolver(resetPassphraseSchema(t)),
    defaultValues: { password: '', passphrase: '', confirm: '' },
  })
  const signInForm = useForm<TSignInAgainForm>({
    resolver: zodResolver(signInAgainSchema()),
    defaultValues: { password: '' },
  })
  const isSignedIn = update.needsPassword || update.hasSignedInAgain
  const checkForm = useForm<TUnlockForm>({
    resolver: zodResolver(unlockSchema(t)),
    defaultValues: { passphrase: '' },
  })

  const close = () => {
    setDialog(undefined)
    update.clearError()
    turnOff.clearError()
    passphraseForm.reset()
    resetForm.reset()
    signInForm.reset()
    checkForm.reset()
    setHasSavedCode(false)
  }

  const loadFromOthers = async () => {
    try {
      setFromOthers(await turnOff.countFromOthers())
    } catch {
      setFromOthers(0)
    }
  }

  const open = (next: TDialog) => {
    close()
    if (next === 'recovery' || next === 'reset')
      setNewCode(generateRecoveryCode())
    else if (next === 'off') {
      setFromOthers(undefined)
      void loadFromOthers()
    }
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
                    onClick={() => open('removePasskeys')}
                  >
                    {t('encryption.settings.removePasskeys')}
                  </button>
                  {canUsePasskeys() && (
                    <>
                      {' · '}
                      <button
                        type="button"
                        className="underline underline-offset-4"
                        onClick={() => open('reset')}
                      >
                        {t('encryption.unlock.forgot')}
                      </button>
                    </>
                  )}
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('encryption.settings.sharedNote')}
            </p>
            {unreadable.items.length > 0 && (
              <div
                role="status"
                className="grid gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm"
              >
                <p>
                  {t('encryption.settings.unreadable', {
                    count: unreadable.items.length,
                  })}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  disabled={unreadable.isPending}
                  onClick={async () => {
                    if (await unreadable.shareThem())
                      toast({
                        description: t('encryption.settings.sharedPlain'),
                      })
                  }}
                >
                  {t('encryption.settings.shareUnencrypted')}
                </Button>
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              className="w-fit gap-2 text-destructive-text"
              onClick={() => open('off')}
            >
              <LockKeyholeOpen className="size-4" />
              {t('encryption.off.button')}
            </Button>
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
                !(await update.changePassphrase(
                  values.current,
                  values.passphrase,
                ))
              ) {
                return
              }

              toast({
                description: t('encryption.settings.passphraseChanged'),
              })
              close()
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
        open={dialog === 'reset'}
        setOpen={(value) => (value ? setDialog('reset') : close())}
        title={t('encryption.settings.resetTitle')}
      >
        <FormProvider {...resetForm}>
          <form
            className="grid gap-3"
            onSubmit={resetForm.handleSubmit(async (values) => {
              if (
                !(await update.resetWithPasskey(
                  values.password,
                  values.passphrase,
                  newCode,
                ))
              ) {
                return
              }

              toast({ description: t('encryption.settings.resetDone') })
              close()
            })}
          >
            <p className="text-sm text-muted-foreground">
              {t('encryption.settings.resetDescription')}
            </p>
            <SignInAgain update={update} />
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
            <RecoveryCode code={newCode} />
            <div className="flex items-start gap-2">
              <Checkbox
                id="encryption-reset-code-saved"
                checked={hasSavedCode}
                onCheckedChange={(checked) => setHasSavedCode(checked === true)}
              />
              <Label
                htmlFor="encryption-reset-code-saved"
                className="text-sm leading-snug font-normal"
              >
                {t('encryption.recovery.confirm')}
              </Label>
            </div>
            {error}
            <Button
              type="submit"
              className="gap-2"
              disabled={!hasSavedCode || !isSignedIn || update.isPending}
            >
              <Fingerprint className="size-4" />
              {t('encryption.settings.reset')}
            </Button>
          </form>
        </FormProvider>
      </Modal>

      <Modal
        open={dialog === 'removePasskeys'}
        setOpen={(value) => (value ? setDialog('removePasskeys') : close())}
        title={t('encryption.settings.removePasskeys')}
      >
        <FormProvider {...signInForm}>
          <form
            className="grid gap-3"
            onSubmit={signInForm.handleSubmit(async (values) => {
              if (!(await update.removePasskeys(values.password))) return

              setReloadKeyring((value) => value + 1)
              close()
            })}
          >
            <p className="text-sm text-muted-foreground">
              {t('encryption.settings.removePasskeysDescription')}
            </p>
            <SignInAgain update={update} />
            {error}
            <Button
              type="submit"
              variant="destructive"
              disabled={!isSignedIn || update.isPending}
            >
              {t('encryption.settings.removePasskeys')}
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
                !(await update.replaceRecoveryCode(values.passphrase, newCode))
              ) {
                return
              }

              toast({
                description: t('encryption.settings.recoveryReplaced'),
              })
              close()
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
        open={dialog === 'off'}
        setOpen={(value) => (value ? setDialog('off') : close())}
        title={t('encryption.off.title')}
      >
        <FormProvider {...checkForm}>
          <form
            className="grid gap-3"
            onSubmit={checkForm.handleSubmit(async (values) => {
              if (!(await turnOff.mutate(values.passphrase))) {
                return
              }

              toast({ description: t('encryption.off.done') })
              close()
            })}
          >
            <p className="text-sm text-muted-foreground">
              {t('encryption.off.own')}
            </p>
            {fromOthers !== undefined && fromOthers > 0 && (
              <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
                {t('encryption.off.fromOthers', { count: fromOthers })}
              </p>
            )}
            <PassphraseCheck />
            {turnOff.error && (
              <p
                role="alert"
                className="text-sm text-destructive-text"
              >
                {turnOff.error}
              </p>
            )}
            <Button
              type="submit"
              variant="destructive"
              disabled={turnOff.isPending || fromOthers === undefined}
            >
              {t(
                turnOff.isPending
                  ? 'encryption.off.working'
                  : 'encryption.off.confirm',
              )}
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
              if (!(await update.addPasskey(values.passphrase))) {
                return
              }

              toast({ description: t('encryption.passkey.added') })
              setReloadKeyring((value) => value + 1)
              close()
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
