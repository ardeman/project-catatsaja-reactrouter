import { useEffect, useState } from 'react'

import { appName } from '~/lib/constants/metadata'
import { getRandomIndex } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'

import { IconComponent, icons } from './constant'
import { TProperties } from './type'

export const LoadingSpinner = (properties: TProperties) => {
  const { classname } = properties
  const [counter, setCounter] = useState(getRandomIndex(icons.length, -1))

  useEffect(() => {
    // Change the icon at the end of each animation cycle
    const interval = setInterval(() => {
      setCounter((previousCounter) =>
        getRandomIndex(icons.length, previousCounter),
      )
    }, 3000) // Keep this at 3000ms

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={cn(
        'flex min-h-dvh items-center justify-center bg-muted/40',
        classname,
      )}
    >
      <div className="absolute flex h-24 w-24 flex-col items-center justify-center">
        <div
          className={cn(
            'animate-rotate flex h-48 w-24 origin-bottom justify-center text-5xl',
          )}
        >
          <IconComponent counter={counter} />
        </div>
        <span className="absolute bottom-0 whitespace-nowrap text-base font-semibold">
          {appName}
        </span>
      </div>
    </div>
  )
}
