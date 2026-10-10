import { Eye, EyeClosed } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'

type TProperties = {
  isVisible: boolean
  onToggle: () => void
  disabled?: boolean
}

export const PasswordToggle = (properties: TProperties) => {
  const { isVisible, onToggle, disabled } = properties
  const { t } = useTranslation()
  const label = t(
    isVisible ? 'auth.form.password.hide' : 'auth.form.password.show',
  )
  const Icon = isVisible ? Eye : EyeClosed
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute right-0 size-11 min-w-[44px] rounded-md text-muted-foreground"
      aria-label={label}
      title={label}
      aria-pressed={isVisible}
      onClick={onToggle}
      disabled={disabled}
    >
      <Icon aria-hidden="true" />
    </Button>
  )
}
