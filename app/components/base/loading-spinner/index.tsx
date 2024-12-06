import { useEffect, useState } from 'react'

import { appName } from '~/lib/constants'
import { cn, getRandomIndex } from '~/lib/utils'

import { IconComponent, icons } from './data'
import { TProps } from './type'

export const LoadingSpinner = (props: TProps) => {
  const { classname } = props
  const [counter, setCounter] = useState(getRandomIndex(icons.length, -1))

  useEffect(() => {
    // Change the icon at the end of each animation cycle
    const interval = setInterval(() => {
      setCounter((prevCounter) => getRandomIndex(icons.length, prevCounter))
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
