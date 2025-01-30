import { Outlet } from 'react-router'

const Auth = () => {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40">
      <Outlet />
    </main>
  )
}

export default Auth
