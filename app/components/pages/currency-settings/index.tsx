import { useState } from 'react'

import { CurrencyFormat } from './format'
import { ManageCurrencies } from './manage'

export const CurrencySettingsPage = () => {
  const [disabled, setDisabled] = useState(false)

  return (
    <div className="grid gap-6">
      <CurrencyFormat
        disabled={disabled}
        setDisabled={setDisabled}
      />
      <ManageCurrencies
        disabled={disabled}
        setDisabled={setDisabled}
      />
    </div>
  )
}
