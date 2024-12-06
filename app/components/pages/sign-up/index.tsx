import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@remix-run/react'
import { Eye, EyeClosed } from 'lucide-react'
import { FC, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { Button, Input, ModeToggle } from '~/components/base'
import {
  Button as UIButton,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Card,
} from '~/components/ui'
import { TSignUpRequest } from '~/lib/types'
import { signUpSchema } from '~/lib/validations'

export const SignUpPage: FC = () => {
  const isRegisterPending = false
  const [disabled, setDisabled] = useState(false)
  const [passwordType, setPasswordType] = useState('password')
  const formMethods = useForm<TSignUpRequest>({
    resolver: zodResolver(signUpSchema),
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
    console.log('data', data) // eslint-disable-line no-console
    // mutateRegister(data)
  })
  const togglePassword = () => {
    setPasswordType((prev) => (prev === 'password' ? 'text' : 'password'))
  }

  return (
    <Card className="min-h-dvh w-full max-w-md rounded-none border-none shadow-none md:min-h-fit md:rounded-md md:border md:shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="grid">
            <CardTitle>Sign up</CardTitle>
            <CardDescription>
              Enter your information to create an account
            </CardDescription>
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
              label="Display Name"
              name="displayName"
              placeholder="Display Name"
              autoFocus
              required
              disabled={disabled}
            />
            <Input
              label="Email"
              name="email"
              placeholder="you@example.com"
              required
              disabled={disabled}
            />
            <Input
              label="Password"
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
              label="Confirm Password"
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
              Continue
            </Button>
          </form>
        </FormProvider>
      </CardContent>
      <CardFooter className="grid space-y-4">
        <div className="text-center text-sm">
          Already have an account?{' '}
          <UIButton
            variant="link"
            asChild
          >
            <Link to="/auth/sign-in">Sign in</Link>
          </UIButton>
        </div>
      </CardFooter>
    </Card>
  )
}
