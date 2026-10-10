import { FinanceProvider } from './context'
import { List } from './list.client'
export { FinanceProvider, useFinance } from './context'

export const FinancesPage = () => {
  return (
    <FinanceProvider>
      <List />
    </FinanceProvider>
  )
}
