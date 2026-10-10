import { zodResolver } from '@hookform/resolvers/zod'
import { FC, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { AuthHeader } from '~/components/base/auth-header'
import { Button } from '~/components/base/button'
import { Card, CardContent, CardFooter } from '~/components/base/card'
import { Input } from '~/components/base/input'
import { Button as UIButton } from '~/components/ui/button'
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
    <Card className="relative w-full max-w-md rounded-2xl [&_a]:min-h-[44px] [&_button]:min-h-[44px] [&_input]:h-11 [&_input]:min-h-[44px] [&_input]:text-[max(1rem,16px)] md:[&_input]:text-sm">
      <AuthHeader
        title={t('auth.forgotPassword.title')}
        description={t('auth.forgotPassword.description')}
        showSize={false}
      />
      <CardContent className="pb-4">
        <FormProvider {...formMethods}>
          <form
            noValidate
            onSubmit={onSubmit}
            className="space-y-6"
          >
            <Input
              label={t('auth.form.email.label')}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t('auth.form.email.placeholder')}
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
