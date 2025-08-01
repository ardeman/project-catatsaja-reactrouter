import { Content } from './content'
import { FinanceProvider } from './context'

export const FinanceDetailPage = () => {
  return (
    <FinanceProvider>
      <Content />
    </FinanceProvider>
  )
}
