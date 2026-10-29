import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { usePlan } from '~/lib/hooks/use-plan'
import { cn } from '~/lib/utils/shadcn'

// The person's plan, shown with their account: Free, or Plus and when it ends.
// With `onClick`, a button that opens what Plus is.
export const PlanBadge = ({
  className,
  onClick,
}: {
  className?: string
  onClick?: () => void
}) => {
  const { t, i18n } = useTranslation()
  const { hasPlus, endsAt } = usePlan()
  const Tag = onClick ? 'button' : 'span'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      title={onClick ? t('plus.info.open') : undefined}
      onClick={onClick}
      className={cn(
        'flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground',
        hasPlus && 'border-primary/40 text-primary',
        onClick &&
          'cursor-pointer transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        className,
      )}
    >
      {hasPlus && (
        <Sparkles
          aria-hidden="true"
          className="size-3"
        />
      )}
      {hasPlus && endsAt
        ? t('plus.until', {
            date: new Intl.DateTimeFormat(i18n.language, {
              dateStyle: 'medium',
            }).format(endsAt),
          })
        : t('plus.free')}
    </Tag>
  )
}
