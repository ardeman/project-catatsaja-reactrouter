import { Check, CloudOff, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '~/lib/utils/shadcn'

import { TSaveStatusProperties } from './type'

export const SaveStatus = (properties: TSaveStatusProperties) => {
  const { status } = properties
  const { t } = useTranslation()
  if (status === 'idle') return null

  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-1',
        status === 'error' && 'text-destructive',
      )}
    >
      {status === 'saving' && <LoaderCircle className="size-3 animate-spin" />}
      {status === 'saved' && <Check className="size-3" />}
      {status === 'error' && <CloudOff className="size-3" />}
      {t(`form.status.${status}`)}
    </span>
  )
}
export type { TSaveStatus } from './type'
