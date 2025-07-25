import * as React from 'react'

import { cn } from '~/lib/utils/shadcn'

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...properties }, reference) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-20 md:text-sm',
        className,
      )}
      ref={reference}
      {...properties}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
