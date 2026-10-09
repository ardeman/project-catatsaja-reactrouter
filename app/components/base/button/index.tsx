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
    as: _as,
    ...rest
  } = properties
  return (
    <div className={cn(containerClassName, 'grid gap-1')}>
      <UIButton
        variant={variant}
        onClick={onClick}
        type={type}
        className={cn(className, 'flex items-center justify-center gap-2')}
        disabled={disabled}
        {...rest}
      >
        <Loader2 className={isLoading ? 'animate-spin' : 'hidden'} />
        {!isLoading && children}
      </UIButton>
    </div>
  )
}
