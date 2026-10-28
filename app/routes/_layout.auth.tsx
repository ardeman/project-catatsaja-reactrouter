import { Outlet } from 'react-router'

import { AboutFooter } from '~/components/layouts/about-footer'
import { MaintenanceGate } from '~/components/layouts/maintenance-gate'
import { StatusBarFade } from '~/components/layouts/status-bar-fade'

const Auth = () => {
  return (
    <main className="app-background relative flex min-h-dvh flex-col items-center justify-start pt-[env(safe-area-inset-top)] md:justify-center [&_.text-destructive]:text-destructive-text">
      <StatusBarFade />
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
