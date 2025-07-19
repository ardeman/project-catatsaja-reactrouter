import { zodResolver } from '@hookform/resolvers/zod'
import { FC, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '~/components/base/button'
import { Input } from '~/components/base/input'
import { LanguageSelector } from '~/components/base/language-selector'
import { ModeToggle } from '~/components/base/mode-toggle'
import { Button as UIButton } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { useForgotPassword } from '~/lib/hooks/use-forgot-password'
import { TEmailRequest } from '~/lib/types/user'
import { emailSchema } from '~/lib/validations/user'

export const ForgotPasswordPage: FC = () => {
  const { t } = useTranslation(['common', 'zod'])
  const [disabled, setDisabled] = useState(false)
  const [timerForgotPassword, setTimerForgotPassword] = useState<number>()
  const formMethods = useForm<TEmailRequest>({
    resolver: zodResolver(emailSchema(t)),
    defaultValues: {
      email: '',
    },
  })
  const { handleSubmit } = formMethods
  const onSubmit = handleSubmit(async (data) => {
    setDisabled(true)
    mutateForgotPassword(data)
  })

  const {
    mutate: mutateForgotPassword,
    isPending: isForgotPasswordPending,
    isSuccess: isForgotPasswordSuccess,
    isError: isForgotPasswordError,
  } = useForgotPassword()

  useEffect(() => {
    if (isForgotPasswordError || isForgotPasswordSuccess) {
      setDisabled(false)
    }
    if (isForgotPasswordSuccess) {
      setTimerForgotPassword(30)
    }
  }, [isForgotPasswordSuccess, isForgotPasswordError])

  useEffect(() => {
    if (timerForgotPassword === 0) {
      setTimerForgotPassword(undefined)
    } else if (timerForgotPassword) {
      const timer = setTimeout(() => {
        setTimerForgotPassword((previous) => previous! - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [timerForgotPassword])

  return (
    <Card className="relative min-h-dvh w-full max-w-md rounded-none border-none shadow-none md:min-h-fit md:rounded-md md:border md:shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="grid">
            <CardTitle className="text-2xl">
              {t('auth.forgotPassword.title')}
            </CardTitle>
            <CardDescription>
              {t('auth.forgotPassword.description')}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <LanguageSelector />
            <ModeToggle />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <FormProvider {...formMethods}>
          <form
            onSubmit={onSubmit}
            className="space-y-6"
          >
            <Input
              label={t('auth.form.email.label')}
              name="email"
              placeholder="you@me.com"
              required
              disabled={disabled}
            />
            <Button
              disabled={disabled || !!timerForgotPassword}
              isLoading={isForgotPasswordPending}
              type="submit"
            >
              {t('auth.form.submit.label')}{' '}
              {timerForgotPassword && `(${timerForgotPassword})`}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
      <CardFooter className="grid space-y-4">
        <div className="text-center text-sm">
          {t('auth.forgotPassword.form.switch.label')}{' '}
          <UIButton
            variant="link"
            asChild
          >
            <Link to="/auth/sign-in">
              {t('auth.forgotPassword.form.switch.link')}
            </Link>
          </UIButton>
        </div>
      </CardFooter>
    </Card>
  )
}
