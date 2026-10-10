import {
  MouseEvent,
  PointerEvent,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router'

import { appleIcon, appName } from '~/lib/constants/metadata'
import { navs, readStartPage } from '~/lib/constants/navigation'
import { useUserData } from '~/lib/hooks/use-get-user'
import { cn } from '~/lib/utils/shadcn'

import { TProperties } from './type'

// Movement before a press on the pill counts as a swipe, not a tap.
const SWIPE_THRESHOLD = 6

type TBox = { left: number; width: number }

export const Navigation = (properties: TProperties) => {
  const { className, variant = 'bar' } = properties
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: userData } = useUserData()
  const isBottom = variant === 'bottom'
  const items = navs(t, userData?.navOrder)
  const activeIndex = items.findIndex(
    (nav) => pathname.split('/')[1] === nav.href.split('/')[1],
  )

  // The phone pill: a highlight that slides to the current page, and that
  // follows a finger dragged across the pill (opening the page it is
  // released on), like the iOS tab bar.
  const navReference = useRef<HTMLElement>(null)
  const itemReferences = useRef<(HTMLAnchorElement | null)[]>([])
  const [boxes, setBoxes] = useState<TBox[]>([])
  const press = useRef<{ x: number; isSwipe: boolean }>(undefined)
  const wasSwipe = useRef(false)
  const [drag, setDrag] = useState<{ x: number; index: number }>()

  // Positions inside the pill (its padding box, where the highlight is
  // placed), so they don't depend on where the pill sits on screen.
  const measure = useCallback(() => {
    setBoxes(
      itemReferences.current.map((item) => ({
        left: item?.offsetLeft ?? 0,
        width: item?.offsetWidth ?? 0,
      })),
    )
  }, [])

  useLayoutEffect(() => {
    if (!isBottom || !navReference.current) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(navReference.current)
    return () => observer.disconnect()
  }, [isBottom, measure, items.length])

  const indexAt = (x: number) => {
    let nearest = 0
    for (const [index, box] of boxes.entries()) {
      const center = box.left + box.width / 2
      const best = boxes[nearest]
      if (Math.abs(x - center) < Math.abs(x - (best.left + best.width / 2)))
        nearest = index
    }
    return nearest
  }

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    // A swipe released outside a link leaves no click to swallow.
    wasSwipe.current = false
    press.current = { x: event.clientX, isSwipe: false }
  }

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const current = press.current
    const nav = navReference.current
    if (!current || !nav) return
    if (
      !current.isSwipe &&
      Math.abs(event.clientX - current.x) < SWIPE_THRESHOLD
    )
      return
    if (!current.isSwipe) {
      current.isSwipe = true
      nav.setPointerCapture(event.pointerId)
      measure()
    }
    const x = event.clientX - nav.getBoundingClientRect().left - nav.clientLeft
    const index = indexAt(x)
    if (index !== drag?.index) navigator.vibrate?.(8)
    setDrag({ x, index })
  }

  const handlePointerUp = () => {
    const current = press.current
    press.current = undefined
    if (!current?.isSwipe || !drag) return
    wasSwipe.current = true
    setDrag(undefined)
    if (drag.index !== activeIndex) navigate(items[drag.index].href)
  }

  const handlePointerCancel = () => {
    press.current = undefined
    setDrag(undefined)
  }

  // A swipe ends over a link; it must not also open it as a tap.
  const handleClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!wasSwipe.current) return
    wasSwipe.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  const highlighted = drag?.index ?? activeIndex
  const activeBox = boxes[activeIndex]
  const width = boxes[0]?.width ?? 0
  const lastBox = boxes.at(-1)
  const indicator = drag
    ? {
        left: Math.min(
          Math.max(drag.x - width / 2, boxes[0]?.left ?? 0),
          (lastBox?.left ?? 0) + (lastBox?.width ?? 0) - width,
        ),
        width,
      }
    : activeBox

  return (
    <nav
      ref={navReference}
      aria-label={t('navigation.menu')}
      data-variant={variant}
      className={cn(
        'gap-6 text-lg font-medium',
        // No link menu on a long press (iOS callout, Android context menu):
        // holding the pill starts a swipe.
        isBottom &&
          'relative touch-none select-none [-webkit-touch-callout:none]',
        className,
      )}
      {...(isBottom && {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerCancel,
        onClickCapture: handleClickCapture,
        onContextMenu: (event: MouseEvent<HTMLElement>) =>
          event.preventDefault(),
      })}
    >
      {isBottom && indicator && indicator.width > 0 && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-1 left-0 rounded-full bg-primary/15',
            drag
              ? 'scale-105 bg-primary/25 ring-1 ring-primary/30 backdrop-blur-md'
              : 'motion-safe:transition-[translate,scale,width] motion-safe:duration-300 motion-safe:ease-out',
          )}
          style={{
            width: indicator.width,
            // `translate`, not `transform`: CSS scales a transform's
            // offset along with the box while it is enlarged.
            translate: `${indicator.left}px 0`,
          }}
        />
      )}
      {!isBottom && (
        <Link
          to={`/${userData?.startPage ?? readStartPage()}`}
          className="flex shrink-0 items-center gap-2 text-lg font-semibold whitespace-nowrap md:text-base"
        >
          <img
            src={appleIcon}
            alt=""
            className="size-6 object-contain"
          />
          <span className="sr-only">{appName}</span>
        </Link>
      )}
      {items.map((nav, index) => {
        const isActive = index === activeIndex
        const Icon = nav.icon
        return (
          <Link
            key={nav.href}
            ref={(element) => {
              itemReferences.current[index] = element
            }}
            to={nav.href}
            aria-current={isActive ? 'page' : undefined}
            draggable={false}
            className={cn(
              isBottom && '[-webkit-touch-callout:none]',
              'flex items-center gap-2 whitespace-nowrap transition-colors hover:text-foreground',
              isActive ? 'text-primary' : 'text-muted-foreground',
              isBottom &&
                'relative h-14 min-w-0 flex-col justify-center gap-0.5 rounded-full px-1 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
              isBottom &&
                (index === highlighted
                  ? 'text-foreground'
                  : 'text-muted-foreground'),
            )}
          >
            {Icon && (
              <Icon
                aria-hidden="true"
                className={cn('size-4', isBottom && 'size-5')}
              />
            )}
            {nav.name}
          </Link>
        )
      })}
    </nav>
  )
}
