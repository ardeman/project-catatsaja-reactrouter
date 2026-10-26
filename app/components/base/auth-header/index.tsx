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
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <h1 className="min-w-0 text-2xl leading-tight font-semibold tracking-tight">
            {title}
          </h1>
          <div className="flex shrink-0 gap-2 [&_button]:size-11 [&_button]:min-w-[44px]">
            <LanguageSelector />
            <ModeToggle />
            {showSize && <SizeToggle />}
          </div>
        </div>
        <CardDescription>{description}</CardDescription>
      </div>
    </CardHeader>
  )
}
