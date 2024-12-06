import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@remix-run/react'
import { Eye, EyeClosed } from 'lucide-react'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { FcGoogle } from 'react-icons/fc'

import { Button, Input, ModeToggle } from '~/components/base'
import {
  Button as UIButton,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui'
import { appName } from '~/constants'
import { TSignInRequest } from '~/types'
import { signInSchema } from '~/validations'

export const SignInPage = () => {
  const isLoginGooglePending = false
  const isLoginPending = false
  const [disabled, setDisabled] = useState(false)
  const [passwordType, setPasswordType] = useState('password')
  const formMethods = useForm<TSignInRequest>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  const { handleSubmit } = formMethods
  const onSubmit = handleSubmit(async (data) => {
    setDisabled(true)
    console.log('data', data) // eslint-disable-line no-console
    // mutateLogin(data)
  })
  const togglePassword = () => {
    setPasswordType((prev) => (prev === 'password' ? 'text' : 'password'))
  }

  const handleLoginGoogle = () => {
    // mutateLoginGoogle()
    setDisabled(true)
  }

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="grid">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>to continue to {appName}</CardDescription>
          </div>
          <ModeToggle />
        </div>
      </CardHeader>
      <CardContent>
        <FormProvider {...formMethods}>
          <form
            onSubmit={onSubmit}
            className="space-y-6"
          >
            <Input
              label="Email"
              name="email"
              placeholder="you@example.com"
              autoFocus
              required
              disabled={disabled}
            />
            <Input
              label="Password"
              name="password"
              type={passwordType}
              hint={
                <Link
                  to="/auth/forgot-password"
                  className="block text-right hover:underline"
                >
                  Forgot your password?
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
              Continue
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
          Continue with Google
        </Button>
        <div className="text-center text-sm">
          Don&apos;t have an account?{' '}
          <UIButton
            variant="link"
            asChild
          >
            <Link to="/auth/sign-up">Sign up</Link>
          </UIButton>
        </div>
      </CardFooter>
    </>
  )
}
