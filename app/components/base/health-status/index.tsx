import { CircleCheck, OctagonAlert, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { TStatus } from '~/lib/constants/health'
import { cn } from '~/lib/utils/shadcn'

const tones = {
  good: {
    icon: CircleCheck,
    className: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    icon: TriangleAlert,
    className: 'text-amber-700 dark:text-amber-400',
  },
  serious: { icon: OctagonAlert, className: 'text-destructive-text' },
}

// A health value's status in words, with an icon for its tone, so it never
// depends on colour alone.
export const HealthStatus = ({
  status,
  className,
}: {
  status: TStatus
  className?: string
}) => {
  const { t } = useTranslation()
  const { icon: Icon, className: tone } = tones[status.tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        tone,
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className="size-3.5 shrink-0"
      />
      {t(`health.status.${status.key}`)}
    </span>
  )
}
