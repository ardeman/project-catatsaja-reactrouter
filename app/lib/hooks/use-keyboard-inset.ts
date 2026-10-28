import { useCallback, useSyncExternalStore } from 'react'

type TKeyboardInset = {
  // How far the on-screen keyboard reaches up from the bottom of the layout
  // viewport, in pixels (0 with no keyboard).
  bottom: number
  // The height of what is still visible above it.
  height: number
}

const noSubscribe = () => () => {}

// "bottom,height", a string so an unchanged keyboard keeps the same snapshot.
const readInset = () => {
  const viewport = visualViewport
  if (!viewport) return ''
  const bottom = Math.max(
    0,
    Math.round(innerHeight - viewport.height - viewport.offsetTop),
  )
  return `${bottom},${Math.round(viewport.height)}`
}

// Where the on-screen keyboard is while `isActive`, so a bar fixed to the
// bottom can sit just above it: phones keep fixed elements in the layout
// viewport, which the keyboard covers instead of shrinking.
export const useKeyboardInset = (isActive: boolean) => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const viewport = visualViewport
      if (!isActive || !viewport) return noSubscribe()
      viewport.addEventListener('resize', onChange)
      viewport.addEventListener('scroll', onChange)
      return () => {
        viewport.removeEventListener('resize', onChange)
        viewport.removeEventListener('scroll', onChange)
      }
    },
    [isActive],
  )
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (isActive ? readInset() : ''),
    () => '',
  )
  if (!snapshot) return
  const [bottom, height] = snapshot.split(',').map(Number)
  return { bottom, height } satisfies TKeyboardInset
}
