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

    // iOS Safari keeps its own map of where the sheet can be tapped and
    // doesn't always redraw it when the content changes size while open
    // (a notice that turns up later): taps there fall through to the page
    // behind. Putting the box on a new layer for a frame redraws the map.
    let frame = 0
    const relayer = () => {
      cancelAnimationFrame(frame)
      element.style.transform = 'translateZ(0)'
      frame = requestAnimationFrame(() => {
        element.style.transform = ''
      })
    }
    const resizes = new ResizeObserver(relayer)
    const watchChildren = () => {
      for (const child of element.children) resizes.observe(child)
    }
    watchChildren()
    const additions = new MutationObserver(() => {
      watchChildren()
      relayer()
    })
    additions.observe(element, { childList: true })
    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
      resizes.disconnect()
      additions.disconnect()
      cancelAnimationFrame(frame)
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
