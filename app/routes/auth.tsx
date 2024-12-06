import { Outlet } from '@remix-run/react'

const Auth = () => {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40">
      <Outlet />
    </main>
  )
}

export default Auth
