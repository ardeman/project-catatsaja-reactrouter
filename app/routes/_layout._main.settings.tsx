import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import { Sidebar } from '~/components/layouts/sidebar'
import { useDocumentTitle } from '~/lib/hooks/use-document-title'

const Settings = () => {
  const { t } = useTranslation()
  useDocumentTitle(t('navigation.settings'))
  return (
    <div className="flex min-h-fit flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
      <div className="mx-auto grid w-full max-w-4xl gap-2 xl:max-w-6xl">
        <h1 className="text-3xl font-semibold">{t('navigation.settings')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>
      <div className="relative mx-auto grid w-full max-w-4xl items-start gap-6 xl:max-w-6xl">
        <Sidebar />
        <Outlet />
      </div>
    </div>
  )
}

export default Settings
