import { ReactNode } from 'react'

import { CardDescription, CardHeader } from '~/components/base/card'
import { LanguageSelector } from '~/components/base/language-selector'
import { ModeToggle } from '~/components/base/mode-toggle'
import { SizeToggle } from '~/components/base/size-toggle'

type TProperties = {
  title: ReactNode
  description: ReactNode
  showSize?: boolean
}

export const AuthHeader = (properties: TProperties) => {
  const { title, description, showSize = true } = properties
  return (
    <CardHeader>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid min-w-0 gap-1.5">
          <h1 className="text-2xl leading-tight font-semibold tracking-tight">
            {title}
          </h1>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="order-first flex shrink-0 justify-end gap-2 sm:order-none [&_button]:size-11 [&_button]:min-w-[44px]">
          <LanguageSelector />
          <ModeToggle />
          {showSize && <SizeToggle />}
        </div>
      </div>
    </CardHeader>
  )
}
