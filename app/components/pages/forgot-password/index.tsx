import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@remix-run/react'
import { FC, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { Button, Input, ModeToggle } from '~/components/base'
import {
  Button as UIButton,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui'
import { useForgotPassword } from '~/lib/hooks'
import { TEmailRequest } from '~/lib/types'
import { emailSchema } from '~/lib/validations'

export const ForgotPasswordPage: FC = () => {
  const [disabled, setDisabled] = useState(false)
  const [timerForgotPassword, setTimerForgotPassword] = useState<number>()
  const formMethods = useForm<TEmailRequest>({
    resolver: zodResolver(emailSchema),
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
        setTimerForgotPassword((prev) => prev! - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [timerForgotPassword])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40">
      <Card className="min-h-dvh w-full max-w-md rounded-none border-none shadow-none md:min-h-fit md:rounded-md md:border md:shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="grid">
              <CardTitle>Forgot password</CardTitle>
              <CardDescription>
                Enter your email address to reset your password
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
                label="Email"
                name="email"
                placeholder="you@example.com"
                required
                disabled={disabled}
              />
              <Button
                disabled={disabled || !!timerForgotPassword}
                isLoading={isForgotPasswordPending}
                type="submit"
              >
                Continue {timerForgotPassword && `(${timerForgotPassword})`}
              </Button>
            </form>
          </FormProvider>
        </CardContent>
        <CardFooter className="grid space-y-4">
          <div className="text-center text-sm">
            Back to{' '}
            <UIButton
              variant="link"
              className="p-0"
              asChild
            >
              <Link to="/auth/sign-in">Sign in</Link>
            </UIButton>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
