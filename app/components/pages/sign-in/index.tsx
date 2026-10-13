import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import { FcGoogle } from 'react-icons/fc'
import { Link } from 'react-router'

import { AuthHeader } from '~/components/base/auth-header'
import { Button } from '~/components/base/button'
import { CardContent, CardFooter, Card } from '~/components/base/card'
import { Input } from '~/components/base/input'
import { PasswordToggle } from '~/components/base/password-toggle'
import { Button as UIButton } from '~/components/ui/button'
import { appName } from '~/lib/constants/metadata'
import { useDocumentTitle } from '~/lib/hooks/use-document-title'
import { useLogin } from '~/lib/hooks/use-login'
import { useLoginGoogle } from '~/lib/hooks/use-login-google'
import { TSignInRequest } from '~/lib/types/user'
import { signInSchema } from '~/lib/validations/user'

export const SignInPage = () => {
  const { t } = useTranslation(['common', 'zod'])
  useDocumentTitle(t('auth.signIn.title'))
  const [disabled, setDisabled] = useState(false)
  const [passwordType, setPasswordType] = useState('password')
  const formMethods = useForm<TSignInRequest>({
    resolver: zodResolver(signInSchema(t)),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  const { handleSubmit } = formMethods
  const onSubmit = handleSubmit(async (data) => {
    setDisabled(true)
    void mutateLogin(data).then((isDone) => {
      if (!isDone) setDisabled(false)
    })
  })
  const togglePassword = () => {
    setPasswordType((previous) =>
      previous === 'password' ? 'text' : 'password',
    )
  }

  const { mutate: mutateLogin, isPending: isLoginPending } = useLogin()

  const { mutate: mutateLoginGoogle, isPending: isLoginGooglePending } =
    useLoginGoogle()

  const handleLoginGoogle = () => {
    void mutateLoginGoogle().then((isDone) => {
      if (!isDone) setDisabled(false)
    })
    setDisabled(true)
  }

  return (
    <Card className="relative w-full max-w-md rounded-2xl [&_a]:min-h-[44px] [&_button]:min-h-[44px] [&_input]:h-11 [&_input]:min-h-[44px] [&_input]:text-[max(1rem,16px)] md:[&_input]:text-sm">
      <AuthHeader
        title={t('auth.signIn.title')}
        description={
          <Trans
            i18nKey="auth.signIn.description"
            values={{ appName }}
            components={{ span: <strong className="text-primary" /> }}
          />
        }
      />
      <CardContent className="pb-2">
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
            <Input
              label={t('auth.form.password.label')}
              name="password"
              autoComplete="current-password"
              inputClassName="pr-[52px]"
              type={passwordType}
              hint={
                <Link
                  to="/auth/forgot-password"
                  className="flex items-center justify-end text-right hover:underline"
                >
                  {t('auth.form.forgotPassword.label')}
                </Link>
              }
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
              isLoading={isLoginPending}
              type="submit"
            >
              {t('auth.form.submit.label')}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
      <CardFooter className="grid space-y-4">
        <Button
          containerClassName="w-full"
          variant="outline"
          onClick={handleLoginGoogle}
          disabled={disabled}
          isLoading={isLoginGooglePending}
        >
          <FcGoogle className="text-xl" />
          {t('auth.form.submit.withGoogle')}
        </Button>
        <div className="text-center text-sm">
          {t('auth.signIn.form.switch.label')}{' '}
          <UIButton
            variant="link"
            asChild
          >
            <Link to="/auth/sign-up">{t('auth.signIn.form.switch.link')}</Link>
          </UIButton>
        </div>
      </CardFooter>
    </Card>
  )
}
