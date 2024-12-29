import { MoneyLogProvider } from './context'
import { Wrapper } from './wrapper'

export const MoneyLogFormPage = () => {
  return (
    <MoneyLogProvider>
      <Wrapper />
    </MoneyLogProvider>
  )
}
