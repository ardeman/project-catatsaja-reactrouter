import { Outlet } from 'react-router'

import { LanguageSelector } from '~/components/base/language-selector'
import { AboutFooter } from '~/components/layouts/about-footer'
import { MaintenanceGate } from '~/components/layouts/maintenance-gate'

const Auth = () => {
  return (
    <main className="app-background relative flex min-h-dvh flex-col items-center justify-start md:justify-center [&_.text-destructive]:text-destructive-text">
      <div className="flex w-full justify-end px-4 pt-4 md:absolute md:top-0 md:right-0 md:w-auto md:px-6">
        <LanguageSelector />
      </div>
      <MaintenanceGate>
        <div className="flex w-full justify-center px-4 pt-4 pb-3 md:px-6 md:pt-8">
          <Outlet />
        </div>
      </MaintenanceGate>
      <AboutFooter />
    </main>
  )
}

export default Auth
