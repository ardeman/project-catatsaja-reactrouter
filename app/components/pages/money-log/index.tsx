import { MoneyLogProvider } from './context'
import { Wrapper } from './wrapper'

export const MoneyLogPage = () => {
  return (
    <MoneyLogProvider>
      <Wrapper />
    </MoneyLogProvider>
  )
}
