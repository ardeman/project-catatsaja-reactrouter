import { ComponentProps, useEffect, useRef } from 'react'

import { cn } from '~/lib/utils/shadcn'

// The scrolling part of a sheet. vaul only drags the sheet while its content
// is scrolled to the very top, but on a slow pull iOS starts bouncing the
// content first, taking it past the top, so the sheet never follows. At the
// top, a pull down is kept from scrolling and left to vaul.
export const DrawerScroll = ({
  className,
  ...properties
}: ComponentProps<'div'>) => {
  const reference = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = reference.current
    if (!element) return
    let startY = 0
    const onTouchStart = (event: TouchEvent) => {
      startY = event.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? 0
      if (event.cancelable && element.scrollTop <= 0 && y > startY) {
        event.preventDefault()
      }
    }
    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  return (
    <div
      ref={reference}
      className={cn('overflow-y-auto overscroll-y-contain', className)}
      {...properties}
    />
  )
}
