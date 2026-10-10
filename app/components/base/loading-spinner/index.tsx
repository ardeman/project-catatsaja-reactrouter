import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { appName } from '~/lib/constants/metadata'
import { getRandomIndex } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'

import { icons } from './constant'
import { TProperties } from './type'

export const LoadingSpinner = (properties: TProperties) => {
  const { classname } = properties
  const { t } = useTranslation()
  const [counter, setCounter] = useState(0)
  const Icon = icons[counter]

  return (
    <div
      role="status"
      aria-label={t('loading')}
      className={cn(
        'app-background relative flex min-h-dvh items-center justify-center',
        classname,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute flex h-24 w-24 flex-col items-center justify-center"
      >
        <div
          className="flex h-48 w-24 origin-bottom animate-rotate justify-center text-5xl motion-reduce:animate-none"
          // The icon changes only at the invisible boundary between cycles.
          onAnimationIteration={() =>
            setCounter((previousCounter) =>
              getRandomIndex({
                arrayLength: icons.length,
                currentIndex: previousCounter,
              }),
            )
          }
        >
          <Icon />
        </div>
        <span className="absolute bottom-0 text-base font-semibold whitespace-nowrap">
          {appName}
        </span>
      </div>
    </div>
  )
}
