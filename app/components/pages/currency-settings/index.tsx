import { CurrencySettingsProvider } from './context'
import { CurrencyFormat } from './format'
import { ManageCurrencies } from './manage'

export const CurrencySettingsPage = () => {
  return (
    <CurrencySettingsProvider>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <CurrencyFormat />
        <ManageCurrencies />
      </div>
    </CurrencySettingsProvider>
  )
}
