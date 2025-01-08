import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@remix-run/react'
import { Eye, EyeClosed } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import { FcGoogle } from 'react-icons/fc'

import { Button } from '~/components/base/button'
import { Input } from '~/components/base/input'
import { LanguageSelector } from '~/components/base/language-selector'
import { ModeToggle } from '~/components/base/mode-toggle'
import { Button as UIButton } from '~/components/ui/button'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Card,
} from '~/components/ui/card'
import { appName } from '~/lib/constants/metadata'
import { useLogin } from '~/lib/hooks/use-login'
import { useLoginGoogle } from '~/lib/hooks/use-login-google'
import { TSignInRequest } from '~/lib/types/user'
import { signInSchema } from '~/lib/validations/user'

export const SignInPage = () => {
  const { t } = useTranslation(['common', 'zod'])
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
    mutateLogin(data)
  })
  const togglePassword = () => {
    setPasswordType((prev) => (prev === 'password' ? 'text' : 'password'))
  }

  const {
    mutate: mutateLogin,
    isPending: isLoginPending,
    isError: isLoginError,
  } = useLogin()

  const {
    mutate: mutateLoginGoogle,
    isPending: isLoginGooglePending,
    isError: isLoginGoogleError,
  } = useLoginGoogle()

  const handleLoginGoogle = () => {
    mutateLoginGoogle()
    setDisabled(true)
  }

  useEffect(() => {
    if (isLoginError || isLoginGoogleError) {
      setDisabled(false)
    }
  }, [isLoginError, isLoginGoogleError])

  return (
    <Card className="min-h-dvh w-full max-w-md rounded-none border-none shadow-none md:min-h-fit md:rounded-md md:border md:shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="grid">
            <CardTitle className="text-2xl">{t('auth.signIn.title')}</CardTitle>
            <CardDescription>
              <Trans
                i18nKey="auth.signIn.description"
                values={{ appName }}
                components={{ span: <strong className="text-primary" /> }}
              />
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <LanguageSelector />
            <ModeToggle />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <FormProvider {...formMethods}>
          <form
            onSubmit={onSubmit}
            className="space-y-6"
          >
            <Input
              label={t('auth.form.email.label')}
              name="email"
              placeholder="you@me.com"
              autoFocus
              required
              disabled={disabled}
            />
            <Input
              label={t('auth.form.password.label')}
              name="password"
              type={passwordType}
              hint={
                <Link
                  to="/auth/forgot-password"
                  className="block text-right hover:underline"
                >
                  {t('auth.form.forgotPassword.label')}
                </Link>
              }
              required
              disabled={disabled}
              rightNode={({ className }) =>
                passwordType === 'password' ? (
                  <EyeClosed
                    className={className}
                    onClick={togglePassword}
                  />
                ) : (
                  <Eye
                    className={className}
                    onClick={togglePassword}
                  />
                )
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
