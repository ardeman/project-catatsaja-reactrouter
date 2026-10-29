type TStep = 1 | -1

// Finger travel that turns the month, and quiet time that ends a wheel or
// trackpad scroll, so one flick turns one month.
const swipeDistance = 40
const wheelDistance = 40
const wheelQuiet = 150

// The new month slides in from below when going forward, from above when
// going back. Returns a cleanup that stops it.
export const slideMonth = (container: HTMLElement | null, step: TStep) => {
  if (!container || matchMedia('(prefers-reduced-motion: reduce)').matches)
    return
  const animations = [
    ...container.querySelectorAll('[role="grid"], [role="status"]'),
  ].map((element) =>
    element.animate(
      [
        { transform: `translateY(${step * 1.5}rem)`, opacity: 0 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 220, easing: 'ease-out' },
    ),
  )
  return () => {
    for (const animation of animations) animation.cancel()
  }
}

// Swiping up (or scrolling down) over the calendar goes to the next month,
// down (or up) to the one before. The container keeps sideways panning
// only (touch-action), so the page doesn't scroll under the swipe.
export const listenForMonthSwipe = (
  container: HTMLElement | null,
  onStep: (step: TStep) => void,
) => {
  if (!container) return
  let start: { x: number; y: number } | undefined
  let hasSwiped = false
  let wheel = 0
  let isWheelDone = false
  let quiet: ReturnType<typeof setTimeout> | undefined

  const onDown = (event: PointerEvent) => {
    hasSwiped = false
    start = event.isPrimary ? { x: event.clientX, y: event.clientY } : undefined
  }
  const onUp = (event: PointerEvent) => {
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    start = undefined
    if (Math.abs(dy) < swipeDistance || Math.abs(dy) < Math.abs(dx) * 1.5)
      return
    hasSwiped = true
    onStep(dy < 0 ? 1 : -1)
  }
  // The swipe ends on a day; it must not pick it.
  const onClick = (event: MouseEvent) => {
    if (!hasSwiped) return
    hasSwiped = false
    event.preventDefault()
    event.stopPropagation()
  }
  const onCancel = () => {
    start = undefined
  }
  const onWheel = (event: WheelEvent) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
    event.preventDefault()
    clearTimeout(quiet)
    quiet = setTimeout(() => {
      wheel = 0
      isWheelDone = false
    }, wheelQuiet)
    if (isWheelDone) return
    wheel += event.deltaY
    if (Math.abs(wheel) < wheelDistance) return
    isWheelDone = true
    onStep(wheel > 0 ? 1 : -1)
  }

  container.addEventListener('pointerdown', onDown)
  container.addEventListener('pointerup', onUp)
  container.addEventListener('pointercancel', onCancel)
  container.addEventListener('click', onClick, { capture: true })
  container.addEventListener('wheel', onWheel, { passive: false })
  return () => {
    clearTimeout(quiet)
    container.removeEventListener('pointerdown', onDown)
    container.removeEventListener('pointerup', onUp)
    container.removeEventListener('pointercancel', onCancel)
    container.removeEventListener('click', onClick, { capture: true })
    container.removeEventListener('wheel', onWheel)
  }
}
