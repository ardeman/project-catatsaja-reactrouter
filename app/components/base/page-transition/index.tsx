import { PropsWithChildren, useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

import { animatePage } from './animation.client'

export const PageTransition = ({ children }: PropsWithChildren) => {
  const reference = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  useEffect(() => animatePage(reference.current), [pathname])

  // Keep the route tree mounted and its flex/grid layout unchanged.
  return (
    <div
      ref={reference}
      className="contents"
    >
      {children}
    </div>
  )
}
