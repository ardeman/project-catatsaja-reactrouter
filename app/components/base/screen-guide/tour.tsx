import { CSSProperties, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '~/components/ui/popover'
import { TScreenGuide } from '~/lib/constants/screen-guide'

import { findTarget } from './find-target'

type TTourProperties = {
  guide: TScreenGuide
  steps: string[]
  onClose: () => void
}

// Room left around the control inside the light.
const padding = 6

// Dims the page around one control at a time, with its explanation beside
// it. The page can't be used meanwhile; Escape or Skip ends the guide. It sits
// above toasts (z-100), which would otherwise cover it on a phone.
export const Tour = (properties: TTourProperties) => {
  const { guide, steps, onClose } = properties
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [light, setLight] = useState<{ rect: DOMRect; radius: string }>()
  const element = useRef<HTMLElement>(undefined)
  const anchor = useRef({
    getBoundingClientRect: () =>
      element.current?.getBoundingClientRect() ?? new DOMRect(),
  })
  const step = steps[index]
  const isLast = index === steps.length - 1

  useEffect(() => {
    const target = findTarget(step)
    if (!target) {
      onClose()
      return
    }
    element.current = target
    const radius = getComputedStyle(target).borderTopLeftRadius
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'nearest',
    })
    // Follows the control while the page scrolls, resizes or moves it.
    let frame = 0
    const follow = () => {
      const next = target.getBoundingClientRect()
      setLight((current) =>
        current?.radius === radius &&
        current.rect.x === next.x &&
        current.rect.y === next.y &&
        current.rect.width === next.width &&
        current.rect.height === next.height
          ? current
          : { rect: next, radius },
      )
      frame = requestAnimationFrame(follow)
    }
    frame = requestAnimationFrame(follow)
    return () => cancelAnimationFrame(frame)
  }, [step, onClose])

  const goTo = (next: number) => {
    if (next >= steps.length) onClose()
    else if (next >= 0) setIndex(next)
  }

  const lightStyle: CSSProperties | undefined = light && {
    left: light.rect.left - padding,
    top: light.rect.top - padding,
    width: light.rect.width + padding * 2,
    height: light.rect.height + padding * 2,
    borderRadius: `calc(${light.radius} + ${padding}px)`,
  }

  return (
    <>
      {lightStyle &&
        createPortal(
          <div
            aria-hidden="true"
            style={lightStyle}
            className="pointer-events-none fixed z-110 shadow-[0_0_0_9999px_rgb(0_0_0/0.55)] ring-2 ring-primary"
          />,
          document.body,
        )}
      <Popover
        open
        modal
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <PopoverAnchor virtualRef={anchor} />
        <PopoverContent
          aria-labelledby="screen-guide-title"
          sideOffset={padding + 8}
          collisionPadding={16}
          updatePositionStrategy="always"
          onInteractOutside={(event) => event.preventDefault()}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') goTo(index + 1)
            else if (event.key === 'ArrowLeft') goTo(index - 1)
          }}
          className="glass-surface z-111 grid w-80 max-w-[calc(100vw-2rem)] gap-3"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h2
              id="screen-guide-title"
              className="font-semibold"
            >
              {t(`guide.${guide}.title`)}
            </h2>
            <span className="text-xs text-muted-foreground">
              {t('guide.progress', {
                current: index + 1,
                total: steps.length,
              })}
            </span>
          </div>
          <p
            aria-live="polite"
            className="text-sm text-muted-foreground"
          >
            {t(`guide.${guide}.${step}`)}
          </p>
          <div className="flex items-center gap-2">
            {!isLast && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                {t('guide.skip')}
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              {index > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goTo(index - 1)}
                >
                  {t('guide.back')}
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => goTo(index + 1)}
              >
                {t(isLast ? 'guide.done' : 'guide.next')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
