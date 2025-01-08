import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import { Sidebar } from '~/components/layouts/sidebar'

const Settings = () => {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-fit flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
      <div className="mx-auto grid w-full max-w-6xl gap-2">
        <h1 className="text-3xl font-semibold">{t('navigation.settings')}</h1>
      </div>
      <div className="relative mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
        <Sidebar />
        <Outlet />
      </div>
    </div>
  )
}

export default Settings
