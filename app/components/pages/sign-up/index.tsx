import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeClosed } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

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
import { useRegister } from '~/lib/hooks/use-register'
import { TSignUpRequest } from '~/lib/types/user'
import { signUpSchema } from '~/lib/validations/user'

export const SignUpPage = () => {
  const { t } = useTranslation(['common', 'zod'])
  const [disabled, setDisabled] = useState(false)
  const [passwordType, setPasswordType] = useState('password')
  const formMethods = useForm<TSignUpRequest>({
    resolver: zodResolver(signUpSchema(t)),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })
  const { handleSubmit } = formMethods
  const onSubmit = handleSubmit(async (data) => {
    setDisabled(true)
    mutateRegister(data)
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
    <Card className="min-h-dvh w-full max-w-md rounded-none border-none shadow-none md:min-h-fit md:rounded-md md:border md:shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="grid">
            <CardTitle className="text-2xl">{t('auth.signUp.title')}</CardTitle>
            <CardDescription>{t('auth.signUp.description')}</CardDescription>
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
              label={t('auth.form.displayName.label')}
              name="displayName"
              placeholder={t('auth.form.displayName.placeholder')}
              autoFocus // eslint-disable-line jsx-a11y/no-autofocus
              required
              disabled={disabled}
            />
            <Input
              label={t('auth.form.email.label')}
              name="email"
              placeholder={t('auth.form.email.placeholder')}
              required
              disabled={disabled}
            />
            <Input
              label={t('auth.form.password.label')}
              name="password"
              type={passwordType}
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
            <Input
              label={t('auth.form.confirmPassword.label')}
              name="confirmPassword"
              type={passwordType}
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
