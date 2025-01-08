import { Loader2 } from 'lucide-react'

import { Button as UIButton } from '~/components/ui/button'
import { cn } from '~/lib/utils/shadcn'

import { TButtonProperties } from './type'

export const Button = (properties: TButtonProperties) => {
  const {
    disabled,
    children,
    isLoading,
    className,
    type = 'button',
    onClick,
    containerClassName,
    variant,
  } = properties
  return (
    <div className={cn('grid space-y-1', containerClassName)}>
      <UIButton
        variant={variant}
        onClick={onClick}
        type={type}
        className={cn('flex items-center justify-center gap-2', className)}
        disabled={disabled}
      >
        <Loader2 className={isLoading ? 'animate-spin' : 'hidden'} />
        {!isLoading && children}
      </UIButton>
    </div>
  )
}
