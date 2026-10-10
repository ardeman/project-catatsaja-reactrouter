import { ComponentProps } from 'react'

import { Card as UICard } from '~/components/ui/card'
import { cn } from '~/lib/utils/shadcn'

export {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'

export const Card = (properties: ComponentProps<typeof UICard>) => {
  const { className, ...rest } = properties
  return (
    <UICard
      {...rest}
      className={cn('glass-surface', className)}
    />
  )
}
