import { useTranslation } from 'react-i18next'

import { useDocumentTitle } from '~/lib/hooks/use-document-title'

import { HealthLogProvider } from './context'
import { List } from './list.client'
export { HealthLogProvider, useHealthLog } from './context'

export const HealthPage = () => {
  const { t } = useTranslation()
  useDocumentTitle(t('navigation.health'))
  return (
    <HealthLogProvider>
      <List />
    </HealthLogProvider>
  )
}
