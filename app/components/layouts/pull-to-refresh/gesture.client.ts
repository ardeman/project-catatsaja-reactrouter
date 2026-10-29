// How far the indicator travels (half the finger's distance) before letting
// go reloads, and how far it can go.
const threshold = 64
const maxDistance = 96
// Movement before the pull counts as one, so taps and sideways swipes pass.
const slop = 8

// Touches that belong to something else: an open dialog or drawer, an
// element with its own vertical swipe, or a box (or the page) scrolled
// away from its top.
const isOwnedElsewhere = (target: EventTarget | null) => {
  if (
    !(target instanceof Element) ||
    Object.hasOwn(document.body.dataset, 'scrollLocked') ||
    target.closest('[role="dialog"], [data-vaul-drawer], [data-own-swipe]')
  )
    return true
  for (
    let element: Element | null = target;
    element;
    element = element.parentElement
  )
    if (element.scrollTop > 0) return true
  return false
}

// Pulling down at the top of the page reloads it, as the installed app has
// no browser bar to do it with. The indicator follows the pull.
export const listenForPull = (indicator: HTMLElement | null) => {
  if (!indicator) return
  const icon = indicator.firstElementChild as HTMLElement | null
  let start: { x: number; y: number } | undefined
  let isPulling = false
  let distance = 0

  const show = (value: number) => {
    distance = value
    indicator.style.transform = `translate(-50%, ${value}px)`
    indicator.style.opacity = String(Math.min(value / threshold, 1))
    indicator.dataset.ready = String(value >= threshold)
    if (icon) icon.style.transform = `rotate(${value * 4}deg)`
  }
  const hide = () => {
    indicator.style.transition = 'transform 200ms ease-out, opacity 200ms'
    show(0)
  }

  const onStart = (event: TouchEvent) => {
    isPulling = false
    start =
      event.touches.length === 1 && !isOwnedElsewhere(event.target)
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : undefined
  }
  const onMove = (event: TouchEvent) => {
    if (!start) return
    const dx = event.touches[0].clientX - start.x
    const dy = event.touches[0].clientY - start.y
    if (!isPulling) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < slop) return
      // Scrolling the page or swiping sideways: not a pull.
      if (dy <= 0 || Math.abs(dx) > dy) {
        start = undefined
        return
      }
      isPulling = true
      indicator.style.transition = 'none'
    }
    // Keeps iOS from bouncing the page along with the indicator.
    if (event.cancelable) event.preventDefault()
    show(Math.min(Math.max(dy - slop, 0) / 2, maxDistance))
  }
  const onEnd = () => {
    if (!isPulling) return
    start = undefined
    isPulling = false
    if (distance < threshold) return hide()
    indicator.style.transition = 'transform 200ms ease-out'
    show(threshold)
    icon?.classList.add('animate-spin')
    location.reload()
  }

  addEventListener('touchstart', onStart, { passive: true })
  addEventListener('touchmove', onMove, { passive: false })
  addEventListener('touchend', onEnd)
  addEventListener('touchcancel', hide)
  return () => {
    removeEventListener('touchstart', onStart)
    removeEventListener('touchmove', onMove)
    removeEventListener('touchend', onEnd)
    removeEventListener('touchcancel', hide)
  }
}
