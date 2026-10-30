import { useTranslation } from 'react-i18next'

import { useScreenGuide } from '~/components/base/screen-guide'
import { useDocumentTitle } from '~/lib/hooks/use-document-title'

import { FinanceProvider } from './context'
import { List } from './list.client'
export { FinanceProvider, useFinance } from './context'

export const FinancesPage = () => {
  const { t } = useTranslation()
  useDocumentTitle(t('navigation.finances'))
  useScreenGuide('finances')
  return (
    <FinanceProvider>
      <List />
    </FinanceProvider>
  )
}
