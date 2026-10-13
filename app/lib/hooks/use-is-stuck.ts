import { useEffect, useRef, useState } from 'react'

// Whether a `position: sticky` element is held at its `top` (scrolled past
// its place), so it can show a compact version. `sentinel` goes right before
// it: an empty element that scrolls normally. Listens to scrolling anywhere
// (the app scrolls inside a scroll area, not the window).
export const useIsStuck = <TElement extends HTMLElement>() => {
  const reference = useRef<TElement>(null)
  const sentinel = useRef<HTMLDivElement>(null)
  const [isStuck, setIsStuck] = useState(false)

  useEffect(() => {
    let frame = 0
    const check = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const element = reference.current
        const marker = sentinel.current
        if (!element || !marker) return
        const top = Number(getComputedStyle(element).top.replace('px', '')) || 0
        setIsStuck(marker.getBoundingClientRect().top < top)
      })
    }
    check()
    document.addEventListener('scroll', check, { capture: true, passive: true })
    addEventListener('resize', check)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', check, { capture: true })
      removeEventListener('resize', check)
    }
  }, [])

  return { reference, sentinel, isStuck }
}
