import * as React from 'react'

import { cn } from '~/lib/utils/shadcn'

export type InputProperties = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string
  type?: React.HTMLInputTypeAttribute
}

const Input = React.forwardRef<HTMLInputElement, InputProperties>(
  ({ className, type, ...properties }, reference) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-20 md:text-sm',
          className,
        )}
        ref={reference}
        {...properties}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
