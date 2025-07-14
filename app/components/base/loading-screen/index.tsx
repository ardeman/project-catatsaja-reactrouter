import { PropsWithChildren } from 'react'

import { LoadingSpinner } from '~/components/base/loading-spinner'
import { cn } from '~/lib/utils/shadcn'

import { TProperties } from './type'

export const LoadingScreen = (properties: PropsWithChildren<TProperties>) => {
  const { isLoading, children, classname } = properties

  if (isLoading) {
    return <LoadingSpinner classname={cn('min-h-fit flex-1', classname)} />
  }

  return <>{children}</>
}
