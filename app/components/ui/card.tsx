import * as React from 'react'

import { cn } from '~/lib/utils/shadcn'

const Card = ({
  className,
  ref,
  ...properties
}: React.ComponentProps<'div'>) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border bg-card text-card-foreground shadow-sm',
      className,
    )}
    {...properties}
  />
)

const CardHeader = ({
  className,
  ref,
  ...properties
}: React.ComponentProps<'div'>) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1.5 p-6', className)}
    {...properties}
  />
)

const CardTitle = ({
  className,
  ref,
  ...properties
}: React.ComponentProps<'div'>) => (
  <div
    ref={ref}
    className={cn('leading-none font-semibold tracking-tight', className)}
    {...properties}
  />
)

const CardDescription = ({
  className,
  ref,
  ...properties
}: React.ComponentProps<'div'>) => (
  <div
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...properties}
  />
)

const CardContent = ({
  className,
  ref,
  ...properties
}: React.ComponentProps<'div'>) => (
  <div
    ref={ref}
    className={cn('p-6 pt-0', className)}
    {...properties}
  />
)

const CardFooter = ({
  className,
  ref,
  ...properties
}: React.ComponentProps<'div'>) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...properties}
  />
)

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
