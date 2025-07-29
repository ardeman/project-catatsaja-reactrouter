import { CurrencySettingsProvider } from './context'
import { CurrencyFormat } from './format'
import { ManageCurrencies } from './manage'

export const CurrencySettingsPage = () => {
  return (
    <CurrencySettingsProvider>
      <div className="grid gap-6">
        <CurrencyFormat />
        <ManageCurrencies />
      </div>
    </CurrencySettingsProvider>
  )
}
