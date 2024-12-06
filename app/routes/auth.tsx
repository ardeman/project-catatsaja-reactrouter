import { Outlet } from '@remix-run/react'

import { Card } from '~/components/ui'

const Auth = () => {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40">
      <Card className="min-h-dvh w-full max-w-md rounded-none border-none shadow-none md:min-h-fit md:rounded-md md:border md:shadow-sm">
        <Outlet />
      </Card>
    </div>
  )
}

export default Auth
