import { CircleEllipsis } from 'lucide-react'

import { categoryColor, findCategory } from '~/lib/constants/finance'
import { cn } from '~/lib/utils/shadcn'

type TProperties = {
  category: string
  // In a tinted circle (entry lists) or bare (compact lists, pickers).
  chip?: boolean
  className?: string
}

// A finance category's icon in its colour. Always shown beside the
// category's name, so the colour is never the only way to tell.
export const CategoryIcon = ({ category, chip, className }: TProperties) => {
  const Icon = findCategory(category)?.icon ?? CircleEllipsis
  const color = categoryColor(category)
  const icon = (
    <Icon
      aria-hidden="true"
      className={cn('size-4 shrink-0', !chip && className)}
      style={{ color }}
    />
  )
  if (!chip) return icon
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full',
        className,
      )}
      style={{
        backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)`,
      }}
    >
      {icon}
    </span>
  )
}
