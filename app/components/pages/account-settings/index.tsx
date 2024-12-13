import { useState } from 'react'

import { Email } from './email'
import { Google } from './google'

export const AccountSettingsPage = () => {
  const [disabled, setDisabled] = useState(false)

  return (
    <div className="grid gap-6">
      <Email
        disabled={disabled}
        setDisabled={setDisabled}
      />
      <Google
        disabled={disabled}
        setDisabled={setDisabled}
      />
    </div>
  )
}
