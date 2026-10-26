import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '~/lib/utils/shadcn'

import { helpSections as sections } from './type'

// Stays at the top while reading: one row to swipe on a phone, wrapped on
// wider screens, with the section being read highlighted.
export const HelpContents = () => {
  const { t } = useTranslation()
  const navReference = useRef<HTMLElement>(null)
  const listReference = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState<string>()
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const top = navReference.current?.getBoundingClientRect().top
      setStuck(top !== undefined && top <= 0 && scrollY > 0)
      const offset = (navReference.current?.offsetHeight ?? 0) + 32
      let current: string | undefined
      for (const key of sections) {
        const heading = document.querySelector(`#help-${CSS.escape(key)}`)
        if (heading && heading.getBoundingClientRect().top <= offset)
          current = key
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
    }
  }, [])

  // Keep the highlighted chip in view in the swipeable row.
  useEffect(() => {
    const list = listReference.current
    const chip = active
      ? list?.querySelector<HTMLElement>(
          `[data-section="${CSS.escape(active)}"]`,
        )
      : undefined
    if (!list || list.scrollWidth <= list.clientWidth) return
    list.scrollTo({
      left: chip
        ? chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2
        : 0,
      behavior: 'smooth',
    })
  }, [active])

  return (
    <nav
      ref={navReference}
      aria-labelledby="help-contents"
      className={cn(
        'sticky top-0 z-10 -mx-6 grid gap-2 border-b border-transparent px-6 py-3 md:-mx-8 md:px-8',
        stuck && 'border-border bg-background',
      )}
    >
      <h2
        id="help-contents"
        className="text-sm font-medium text-muted-foreground max-sm:sr-only"
      >
        {t('help.contents')}
      </h2>
      <ul
        ref={listReference}
        className="-mx-6 flex [scrollbar-width:none] gap-2 overflow-x-auto px-6 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {sections.map((key) => (
          <li
            key={key}
            className="shrink-0"
          >
            <a
              href={`#help-${key}`}
              data-section={key}
              aria-current={active === key ? 'location' : undefined}
              onClick={(event) => {
                // Land the heading just below this bar, however tall it wraps.
                const heading = document.querySelector(
                  `#help-${CSS.escape(key)}`,
                )
                if (!heading) return
                event.preventDefault()
                const top =
                  heading.getBoundingClientRect().top +
                  scrollY -
                  (navReference.current?.offsetHeight ?? 0) -
                  16
                scrollTo({ top, behavior: 'smooth' })
                history.replaceState(null, '', `#help-${key}`)
              }}
              className={cn(
                'inline-flex rounded-full border px-3 py-1.5 text-sm whitespace-nowrap hover:bg-muted',
                active === key &&
                  'border-primary bg-primary text-primary-foreground hover:bg-primary',
              )}
            >
              {t(`help.${key}.title`)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
