import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { AuthHeader } from '~/components/base/auth-header'
import { Button } from '~/components/base/button'
import { CardContent, CardFooter, Card } from '~/components/base/card'
import { Input } from '~/components/base/input'
import { PasswordToggle } from '~/components/base/password-toggle'
import { Button as UIButton } from '~/components/ui/button'
import { appName } from '~/lib/constants/metadata'
import { useTheme } from '~/lib/contexts/theme'
import { useRegister } from '~/lib/hooks/use-register'
import { TSignUpRequest } from '~/lib/types/user'
import { signUpSchema } from '~/lib/validations/user'

export const SignUpPage = () => {
  const { t, i18n } = useTranslation(['common', 'zod'])
  const [disabled, setDisabled] = useState(false)
  const [passwordType, setPasswordType] = useState('password')
  const { theme, size } = useTheme()
  const formMethods = useForm<TSignUpRequest>({
    resolver: zodResolver(signUpSchema(t)),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      language: i18n.language,
      theme,
      size,
    },
  })
  const { handleSubmit } = formMethods
  const onSubmit = handleSubmit(async (data) => {
    setDisabled(true)
    mutateRegister({ ...data, theme, language: i18n.language, size })
  })
  const togglePassword = () => {
    setPasswordType((previous) =>
      previous === 'password' ? 'text' : 'password',
    )
  }

  const {
    mutate: mutateRegister,
    isPending: isRegisterPending,
    isError: isRegisterError,
  } = useRegister()

  useEffect(() => {
    if (isRegisterError) {
      setDisabled(false)
    }
  }, [isRegisterError])

  return (
    <Card className="relative w-full max-w-md rounded-2xl [&_a]:min-h-[44px] [&_button]:min-h-[44px] [&_input]:h-11 [&_input]:min-h-[44px] [&_input]:text-[max(1rem,16px)] md:[&_input]:text-sm">
      <AuthHeader
        title={t('auth.signUp.title')}
        description={
          <Trans
            i18nKey="auth.signUp.description"
            values={{ appName }}
            components={{ span: <strong className="text-primary" /> }}
          />
        }
      />
      <CardContent className="pb-4">
        <FormProvider {...formMethods}>
          <form
            noValidate
            onSubmit={onSubmit}
            className="space-y-6"
          >
            <Input
              label={t('auth.form.displayName.label')}
              name="displayName"
              autoComplete="name"
              placeholder={t('auth.form.displayName.placeholder')}
              required
              disabled={disabled}
            />
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
            <Input
              label={t('auth.form.password.label')}
              name="password"
              autoComplete="new-password"
              inputClassName="pr-[52px]"
              type={passwordType}
              required
              disabled={disabled}
              rightNode={
                <PasswordToggle
                  isVisible={passwordType === 'text'}
                  onToggle={togglePassword}
                  disabled={disabled}
                />
              }
            />
            <Input
              label={t('auth.form.confirmPassword.label')}
              name="confirmPassword"
              autoComplete="new-password"
              inputClassName="pr-[52px]"
              type={passwordType}
              required
              disabled={disabled}
              rightNode={
                <PasswordToggle
                  isVisible={passwordType === 'text'}
                  onToggle={togglePassword}
                  disabled={disabled}
                />
              }
            />
            <Button
              disabled={disabled}
              isLoading={isRegisterPending}
              type="submit"
            >
              {t('auth.form.submit.label')}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
      <CardFooter className="grid space-y-4">
        <div className="text-center text-sm">
          {t('auth.signUp.form.switch.label')}{' '}
          <UIButton
            variant="link"
            asChild
          >
            <Link to="/auth/sign-in">{t('auth.signUp.form.switch.link')}</Link>
          </UIButton>
        </div>
      </CardFooter>
    </Card>
  )
}
