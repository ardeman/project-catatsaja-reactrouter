import { ModeToggle } from '~/components/base'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui'
import { appName } from '~/constants'

export const SignInPage = () => {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40">
      <Card className="min-h-dvh w-full max-w-md rounded-none border-none shadow-none md:min-h-fit md:rounded-md md:border md:shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="grid">
              <CardTitle>Sign in</CardTitle>
              <CardDescription>to continue to {appName}</CardDescription>
            </div>
            <ModeToggle />
          </div>
        </CardHeader>
        <CardContent></CardContent>
        <CardFooter></CardFooter>
      </Card>
    </div>
  )
}
