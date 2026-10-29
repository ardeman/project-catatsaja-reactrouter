import { zodResolver } from '@hookform/resolvers/zod'
import { BadgeAlert, BadgeCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { Button } from '~/components/base/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/base/card'
import { Input } from '~/components/base/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/base/tooltip'
import { useAuthUser } from '~/lib/hooks/use-auth-user'
import { useEmailVerification } from '~/lib/hooks/use-email-verification'
import { useResetPassword } from '~/lib/hooks/use-reset-password'
import { useUpdateEmail } from '~/lib/hooks/use-update-email'
import { TEmailRequest } from '~/lib/types/user'
import { cn } from '~/lib/utils/shadcn'
import { emailSchema } from '~/lib/validations/user'

import { useAccountSettings } from './context'

export const Email = () => {
  const { disabled, setDisabled } = useAccountSettings()
  const { t } = useTranslation()
  const [timerEmailVerify, setTimerEmailVerify] = useState<number>()
  const [timerUpdateEmail, setTimerUpdateEmail] = useState<number>()
  const [timerSetPassword, setTimerSetPassword] = useState<number>()
  const { revalidate } = useRevalidator()
  const { data: authData } = useAuthUser()
  const formMethods = useForm<TEmailRequest>({
    resolver: zodResolver(emailSchema(t)),
    values: {
      email: authData?.email || '',
    },
  })
  const userPasswordProvider = authData?.providerData.find(
    (provider) => provider.providerId === 'password',
  )
  const { handleSubmit, control, formState } = formMethods
  const watchEmail = useWatch({ control, name: 'email' })

  const { mutate: mutateUpdateEmail, isPending: isUpdateEmailPending } =
    useUpdateEmail()

  const onSubmit = handleSubmit(async (data) => {
    setDisabled(true)
    const isSent = await mutateUpdateEmail(data)
    setDisabled(false)
    if (isSent) setTimerUpdateEmail(30)
  })

  useEffect(() => {
    if (!timerUpdateEmail) return
    const timer = setTimeout(() => {
      if (timerUpdateEmail === 1) {
        setTimerUpdateEmail(undefined)
        revalidate()
      } else setTimerUpdateEmail(timerUpdateEmail - 1)
    }, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerUpdateEmail])

  const {
    mutate: mutateSendEmailVerification,
    isPending: isSendEmailVerificationPending,
  } = useEmailVerification()

  const handleSendEmailVerification = async () => {
    setDisabled(true)
    const isSent = await mutateSendEmailVerification()
    setDisabled(false)
    if (isSent) setTimerEmailVerify(30)
  }

  useEffect(() => {
    if (!timerEmailVerify) return
    const timer = setTimeout(() => {
      if (timerEmailVerify === 1) {
        setTimerEmailVerify(undefined)
        revalidate()
      } else setTimerEmailVerify(timerEmailVerify - 1)
    }, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerEmailVerify])

  const { mutate: mutateSetPassword, isPending: isSetPasswordPending } =
    useResetPassword()

  const handleSetPassword = async () => {
    const isSent = await mutateSetPassword()
    setDisabled(false)
    if (isSent) setTimerSetPassword(30)
  }

  useEffect(() => {
    if (!timerSetPassword) return
    const timer = setTimeout(() => {
      if (timerSetPassword === 1) {
        setTimerSetPassword(undefined)
        revalidate()
      } else setTimerSetPassword(timerSetPassword - 1)
    }, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerSetPassword])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.email.title')}</CardTitle>
        <CardDescription>{t('settings.email.description')}</CardDescription>
      </CardHeader>
      <FormProvider {...formMethods}>
        <form onSubmit={onSubmit}>
          <CardContent className="flex items-end space-x-4">
            <Input
              label={t('auth.form.email.label')}
              name="email"
              disabled={
                disabled || !authData?.emailVerified || !userPasswordProvider
              }
              placeholder={t('auth.form.email.placeholder')}
              className="w-full"
              rightNode={({ className }) =>
                watchEmail === authData?.email && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {authData?.emailVerified ? (
                          <BadgeCheck
                            className={cn(
                              className,
                              'text-green-500 hover:cursor-help',
                            )}
                          />
                        ) : (
                          <BadgeAlert
                            className={cn(
                              className,
                              'text-destructive hover:cursor-help',
                            )}
                          />
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        {t(
                          authData?.emailVerified
                            ? 'settings.email.tooltip.verified'
                            : 'settings.email.tooltip.unverified',
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              }
            />
            {!authData?.emailVerified && (
              <Button
                className="w-fit"
                disabled={disabled || !!timerEmailVerify}
                type="button"
                isLoading={isSendEmailVerificationPending}
                onClick={handleSendEmailVerification}
              >
                {t('settings.email.button.verify')}{' '}
                {timerEmailVerify && `(${timerEmailVerify})`}
              </Button>
            )}
            {!userPasswordProvider && (
              <Button
                className="w-fit"
                disabled={disabled || !!timerSetPassword}
                type="button"
                isLoading={isSetPasswordPending}
                onClick={handleSetPassword}
              >
                {t('settings.email.button.setPassword')}{' '}
                {timerSetPassword && `(${timerSetPassword})`}
              </Button>
            )}
          </CardContent>
          <CardFooter className="space-x-4 border-t px-6 py-4">
            <Button
              disabled={
                isUpdateEmailPending ||
                disabled ||
                !authData?.emailVerified ||
                !!timerUpdateEmail ||
                !userPasswordProvider ||
                !formState.isDirty
              }
              isLoading={isUpdateEmailPending}
              type="submit"
            >
              {t('form.save')} {timerUpdateEmail && `(${timerUpdateEmail})`}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  )
}
