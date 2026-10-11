import { Mars, Venus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { THealthSex } from '~/lib/types/health'
import { cn } from '~/lib/utils/shadcn'

// ♀ in magenta and ♂ in blue (the category palette's validated colours),
// always beside or labelled with the word.
export const SexIcon = ({
  sex,
  className,
  isLabelled,
}: {
  sex: THealthSex
  className?: string
  // Standing alone (no word beside it): the icon carries the label.
  isLabelled?: boolean
}) => {
  const { t } = useTranslation()
  const Icon = sex === 'female' ? Venus : Mars
  return (
    <Icon
      {...(isLabelled
        ? { 'aria-label': t(`health.form.sex.${sex}`), role: 'img' }
        : { 'aria-hidden': true })}
      className={cn('size-3.5 shrink-0', className)}
      style={{ color: sex === 'female' ? 'var(--cat-5)' : 'var(--cat-1)' }}
    />
  )
}
