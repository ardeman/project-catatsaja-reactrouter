import { zodResolver } from '@hookform/resolvers/zod'
import { useRevalidator } from '@remix-run/react'
import { BadgeAlert, BadgeCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button, Input } from '~/components/base'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui'
import {
  useAuthUser,
  useEmailVerification,
  useResetPassword,
  useUpdateEmail,
} from '~/lib/hooks'
import { TEmailRequest } from '~/lib/types'
import { cn } from '~/lib/utils'
import { emailSchema } from '~/lib/validations'

import { TProps } from './type'

export const Email = (props: TProps) => {
  const { disabled, setDisabled } = props
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
  const { handleSubmit, watch } = formMethods
  const watchEmail = watch('email')

  const {
    mutate: mutateUpdateEmail,
    isPending: isUpdateEmailPending,
    isSuccess: isUpdateEmailSuccess,
    isError: isUpdateEmailError,
  } = useUpdateEmail()

  const onSubmit = handleSubmit(async (data) => {
    setDisabled(true)
    mutateUpdateEmail(data)
  })

  useEffect(() => {
    if (isUpdateEmailSuccess || isUpdateEmailError) {
      setDisabled(false)
    }
    if (isUpdateEmailSuccess) {
      setTimerUpdateEmail(30)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpdateEmailSuccess, isUpdateEmailError])

  useEffect(() => {
    if (timerUpdateEmail === 0) {
      setTimerUpdateEmail(undefined)
      revalidate()
    } else if (timerUpdateEmail) {
      const timer = setTimeout(() => {
        setTimerUpdateEmail((prev) => prev! - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerUpdateEmail])

  const {
    mutate: mutateSendEmailVerification,
    isPending: isSendEmailVerificationPending,
    isSuccess: isSendEmailVerificationSuccess,
    isError: isSendEmailVerificationError,
  } = useEmailVerification()

  const handleSendEmailVerification = () => {
    mutateSendEmailVerification()
    setDisabled(true)
  }

  useEffect(() => {
    if (isSendEmailVerificationSuccess || isSendEmailVerificationError) {
      setDisabled(false)
    }
    if (isSendEmailVerificationSuccess) {
      setTimerEmailVerify(30)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSendEmailVerificationSuccess, isSendEmailVerificationError])

  useEffect(() => {
    if (timerEmailVerify === 0) {
      setTimerEmailVerify(undefined)
      revalidate()
    } else if (timerEmailVerify) {
      const timer = setTimeout(() => {
        setTimerEmailVerify((prev) => prev! - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerEmailVerify])

  const {
    mutate: mutateSetPassword,
    isPending: isSetPasswordPending,
    isSuccess: isSetPasswordSuccess,
    isError: isSetPasswordError,
  } = useResetPassword()

  useEffect(() => {
    if (isSetPasswordSuccess || isSetPasswordError) {
      setDisabled(false)
    }
    if (isSetPasswordSuccess) {
      setTimerSetPassword(30)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSetPasswordSuccess, isSetPasswordError])

  useEffect(() => {
    if (timerSetPassword === 0) {
      setTimerSetPassword(undefined)
      revalidate()
    } else if (timerSetPassword) {
      const timer = setTimeout(() => {
        setTimerSetPassword((prev) => prev! - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
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
                              'text-red-500 hover:cursor-help',
                            )}
                          />
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        {authData?.emailVerified
                          ? t('settings.email.tooltip.verified')
                          : t('settings.email.tooltip.unverified')}
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
                onClick={() => mutateSetPassword()}
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
                !userPasswordProvider
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
