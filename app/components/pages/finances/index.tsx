import { useTranslation } from 'react-i18next'

import { useDocumentTitle } from '~/lib/hooks/use-document-title'

import { FinanceProvider } from './context'
import { List } from './list.client'
export { FinanceProvider, useFinance } from './context'

export const FinancesPage = () => {
  const { t } = useTranslation()
  useDocumentTitle(t('navigation.finances'))
  return (
    <FinanceProvider>
      <List />
    </FinanceProvider>
  )
}
