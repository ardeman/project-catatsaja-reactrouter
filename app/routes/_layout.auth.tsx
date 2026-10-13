import { Outlet } from 'react-router'

import { AboutFooter } from '~/components/layouts/about-footer'

const Auth = () => {
  return (
    <main className="app-background relative flex min-h-dvh flex-col items-center justify-start md:justify-center [&_.text-destructive]:text-destructive-text">
      <div className="flex w-full justify-center px-4 pt-8 pb-3 md:px-6">
        <Outlet />
      </div>
      <AboutFooter />
    </main>
  )
}

export default Auth
