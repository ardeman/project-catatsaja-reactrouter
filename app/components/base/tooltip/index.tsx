import { ComponentProps } from 'react'

import { TooltipContent as UITooltipContent } from '~/components/ui/tooltip'
import { cn } from '~/lib/utils/shadcn'

export {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'

// The look every tooltip shares, hints and chart readouts alike.
export const tooltipSurface =
  'rounded-lg border bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-md'

export const TooltipContent = (
  properties: ComponentProps<typeof UITooltipContent>,
) => {
  const { className, ...rest } = properties
  return (
    <UITooltipContent
      {...rest}
      className={cn(tooltipSurface, 'max-w-64', className)}
    />
  )
}
