import { useState } from 'react'

import { Input } from '~/components/base/input'
import { PasswordToggle } from '~/components/base/password-toggle'

type TProperties = {
  name: string
  label: string
  autoComplete: 'current-password' | 'new-password'
  // The screen's only task: start typing here.
  isFocused?: boolean
  disabled?: boolean
}

// A passphrase field with a show/hide toggle.
export const PassphraseInput = ({
  name,
  label,
  autoComplete,
  isFocused,
  disabled,
}: TProperties) => {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <Input
      name={name}
      label={label}
      type={isVisible ? 'text' : 'password'}
      autoComplete={autoComplete}
      autoFocus={isFocused} // eslint-disable-line jsx-a11y/no-autofocus -- the screen's only task
      disabled={disabled}
      required
      rightNode={
        <PasswordToggle
          isVisible={isVisible}
          onToggle={() => setIsVisible((visible) => !visible)}
          disabled={disabled}
        />
      }
    />
  )
}
