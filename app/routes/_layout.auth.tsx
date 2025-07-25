import { Outlet } from 'react-router'

import { AboutFooter } from '~/components/layouts/about-footer'

const Auth = () => {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-start bg-muted/40 md:justify-center">
      <Outlet />
      <AboutFooter />
    </main>
  )
}

export default Auth
