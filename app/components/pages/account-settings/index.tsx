import { zodResolver } from '@hookform/resolvers/zod'
import { useRevalidator } from '@remix-run/react'
import { BadgeAlert, BadgeCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { FcGoogle } from 'react-icons/fc'

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
import { appName } from '~/lib/constants'
import {
  useAuthUser,
  useEmailVerification,
  useLinkGoogle,
  useResetPassword,
  useUpdateEmail,
} from '~/lib/hooks'
import { TEmailRequest } from '~/lib/types'
import { cn } from '~/lib/utils'
import { emailSchema } from '~/lib/validations'

export const AccountSettingsPage = () => {
  const [disabled, setDisabled] = useState(false)
  const [timerEmailVerify, setTimerEmailVerify] = useState<number>()
  const [timerUpdateEmail, setTimerUpdateEmail] = useState<number>()
  const [timerSetPassword, setTimerSetPassword] = useState<number>()
  const { revalidate } = useRevalidator()
  const { data: authData } = useAuthUser()
  const userGoogleProvider = authData?.providerData.find(
    (provider) => provider.providerId === 'google.com',
  )
  const userPasswordProvider = authData?.providerData.find(
    (provider) => provider.providerId === 'password',
  )
  const formMethods = useForm<TEmailRequest>({
    resolver: zodResolver(emailSchema),
    values: {
      email: authData?.email || '',
    },
  })
  const { handleSubmit, watch } = formMethods
  const watchEmail = watch('email')
  const onSubmit = handleSubmit(async (data) => {
    setDisabled(true)
    mutateUpdateEmail(data)
  })

  const {
    mutate: mutateUpdateEmail,
    isPending: isUpdateEmailPending,
    isSuccess: isUpdateEmailSuccess,
    isError: isUpdateEmailError,
  } = useUpdateEmail()

  useEffect(() => {
    if (isUpdateEmailSuccess || isUpdateEmailError) {
      setDisabled(false)
    }
    if (isUpdateEmailSuccess) {
      setTimerUpdateEmail(30)
    }
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
    mutate: mutateLinkGoogle,
    isPending: isLinkGooglePending,
    isSuccess: isLinkGoogleSuccess,
    isError: isLinkGoogleError,
  } = useLinkGoogle()

  const handleLinkGoogle = () => {
    mutateLinkGoogle()
    setDisabled(true)
  }

  useEffect(() => {
    if (isLinkGoogleSuccess || isLinkGoogleError) {
      setDisabled(false)
    }
  }, [isLinkGoogleSuccess, isLinkGoogleError])

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
    <div className="grid gap-6">
      <Card x-chunk="dashboard-04-chunk-1">
        <CardHeader>
          <CardTitle>Change email address</CardTitle>
          <CardDescription>Update your email address.</CardDescription>
        </CardHeader>
        <FormProvider {...formMethods}>
          <form onSubmit={onSubmit}>
            <CardContent className="flex items-end space-x-4">
              <Input
                label="Email"
                name="email"
                disabled={
                  disabled || !authData?.emailVerified || !userPasswordProvider
                }
                placeholder="Display Name"
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
                            ? 'Email verified'
                            : 'Email not verified'}
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
                  Verify Email {timerEmailVerify && `(${timerEmailVerify})`}
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
                  Set Password {timerSetPassword && `(${timerSetPassword})`}
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
                Save {timerUpdateEmail && `(${timerUpdateEmail})`}
              </Button>
            </CardFooter>
          </form>
        </FormProvider>
      </Card>
      <Card x-chunk="dashboard-04-chunk-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-1">
            <span>Link Google account</span>
          </CardTitle>
          <CardDescription>
            After linking your Google account, you can sign in to {appName} with
            your Google account, in addition to using your email and password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            containerClassName="w-full sm:w-fit"
            variant="outline"
            onClick={handleLinkGoogle}
            disabled={disabled || !!userGoogleProvider}
            isLoading={isLinkGooglePending}
          >
            <FcGoogle className="text-xl" />
            {userGoogleProvider
              ? `Linked to ${userGoogleProvider.email}`
              : 'Link your Google account'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
