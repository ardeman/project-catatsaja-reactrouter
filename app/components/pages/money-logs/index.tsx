import { MoneyLogProvider } from './context'
import { Wrapper } from './wrapper'

export const MoneyLogsPage = () => {
  return (
    <MoneyLogProvider>
      <Wrapper />
    </MoneyLogProvider>
  )
}
