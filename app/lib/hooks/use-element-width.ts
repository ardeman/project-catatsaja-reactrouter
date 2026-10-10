import { useEffect, useRef, useState } from 'react'

// The element's current width in pixels (0 until measured), so a chart can
// draw at its real size instead of stretching a fixed drawing.
export const useElementWidth = <TElement extends HTMLElement>() => {
  const reference = useRef<TElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = reference.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { reference, width }
}
