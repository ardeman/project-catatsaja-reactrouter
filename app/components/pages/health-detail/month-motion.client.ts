type TStep = 1 | -1

// Finger travel that turns the month (or less, when flicked fast enough),
// and quiet time that ends a wheel or trackpad scroll, so one flick turns
// one month.
const swipeDistance = 40
const flickDistance = 12
const flickSpeed = 0.35 // px per ms
const wheelDistance = 40
const wheelQuiet = 150
// How far the month follows the finger, and how far it leaves when turned.
const follow = 0.5
const leaveDistance = 48
const ease = 'cubic-bezier(0.22, 1, 0.36, 1)'

const movingParts = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('[role="grid"], [role="status"]'),
]

const prefersLessMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

// Moves the month with the finger, fading as it goes.
const holdAt = (container: HTMLElement, offset: number) => {
  if (prefersLessMotion()) return
  for (const element of movingParts(container)) {
    element.style.transform = offset ? `translateY(${offset}px)` : ''
    element.style.opacity = offset
      ? String(1 - Math.min(Math.abs(offset) / 160, 0.6))
      : ''
  }
}

// Where the finger left the month, as the first keyframe; clears it.
const takeHeld = (element: HTMLElement) => {
  const held = {
    transform: element.style.transform || 'none',
    opacity: element.style.opacity || '1',
  }
  element.style.transform = ''
  element.style.opacity = ''
  return held
}

// Back to rest after a swipe too short to turn the month.
const settle = (container: HTMLElement) => {
  for (const element of movingParts(container)) {
    const held = takeHeld(element)
    if (held.transform === 'none') continue
    element.animate([held, { transform: 'none', opacity: 1 }], {
      duration: 200,
      easing: ease,
    })
  }
}

// The month leaves the way it was pushed; resolves once it is gone. It
// stays hidden (fill) until slideMonth brings the next one in.
const leave = async (container: HTMLElement, step: TStep) => {
  if (prefersLessMotion()) return
  const animations = movingParts(container).map((element) =>
    element.animate(
      [
        takeHeld(element),
        { transform: `translateY(${-step * leaveDistance}px)`, opacity: 0 },
      ],
      { duration: 110, easing: 'ease-in', fill: 'forwards' },
    ),
  )
  // Cancelled when the calendar goes away; nothing left to turn then.
  await Promise.allSettled(animations.map((animation) => animation.finished))
}

// The new month slides in from below when going forward, from above when
// going back. Returns a cleanup that stops it.
export const slideMonth = (container: HTMLElement | null, step: TStep) => {
  if (!container) return
  const parts = movingParts(container)
  for (const element of parts) {
    for (const animation of element.getAnimations()) animation.cancel()
    element.style.transform = ''
    element.style.opacity = ''
  }
  if (prefersLessMotion()) return
  const animations = parts.map((element) =>
    element.animate(
      [
        { transform: `translateY(${step * leaveDistance}px)`, opacity: 0 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 260, easing: ease },
    ),
  )
  return () => {
    for (const animation of animations) animation.cancel()
  }
}

// Swiping up (or scrolling down) over the calendar goes to the next month,
// down (or up) to the one before; the month follows the finger meanwhile.
// The container keeps sideways panning only (touch-action), so the page
// doesn't scroll under the swipe.
export const listenForMonthSwipe = (
  container: HTMLElement | null,
  onStep: (step: TStep) => void,
) => {
  if (!container) return
  let start: { x: number; y: number } | undefined
  let last: { y: number; time: number } | undefined
  let speed = 0
  let hasSwiped = false
  let isTurning = false
  let wheel = 0
  let isWheelDone = false
  let quiet: ReturnType<typeof setTimeout> | undefined

  const turn = (step: TStep) => {
    isTurning = true
    void leave(container, step).then(() => {
      isTurning = false
      onStep(step)
    })
  }

  const onDown = (event: PointerEvent) => {
    hasSwiped = false
    speed = 0
    start =
      !isTurning && event.isPrimary
        ? { x: event.clientX, y: event.clientY }
        : undefined
    last = start && { y: event.clientY, time: event.timeStamp }
  }
  const onMove = (event: PointerEvent) => {
    if (!start || !last) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    const time = event.timeStamp - last.time
    if (time > 0) speed = (event.clientY - last.y) / time
    last = { y: event.clientY, time: event.timeStamp }
    holdAt(container, Math.abs(dy) > Math.abs(dx) ? dy * follow : 0)
  }
  const onUp = (event: PointerEvent) => {
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    start = undefined
    const isVertical = Math.abs(dy) >= Math.abs(dx) * 1.5
    const isFlick =
      Math.sign(speed) === Math.sign(dy) &&
      Math.abs(dy) >= flickDistance &&
      Math.abs(speed) >= flickSpeed
    if (!isVertical || (!isFlick && Math.abs(dy) < swipeDistance)) {
      settle(container)
      return
    }
    hasSwiped = true
    turn(dy < 0 ? 1 : -1)
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
    settle(container)
  }
  const onWheel = (event: WheelEvent) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
    event.preventDefault()
    clearTimeout(quiet)
    quiet = setTimeout(() => {
      if (!isWheelDone) settle(container)
      wheel = 0
      isWheelDone = false
    }, wheelQuiet)
    if (isWheelDone || isTurning) return
    wheel += event.deltaY
    if (Math.abs(wheel) < wheelDistance) {
      holdAt(container, -wheel * follow)
      return
    }
    isWheelDone = true
    turn(wheel > 0 ? 1 : -1)
  }

  container.addEventListener('pointerdown', onDown)
  container.addEventListener('pointermove', onMove)
  container.addEventListener('pointerup', onUp)
  container.addEventListener('pointercancel', onCancel)
  container.addEventListener('click', onClick, { capture: true })
  container.addEventListener('wheel', onWheel, { passive: false })
  return () => {
    clearTimeout(quiet)
    container.removeEventListener('pointerdown', onDown)
    container.removeEventListener('pointermove', onMove)
    container.removeEventListener('pointerup', onUp)
    container.removeEventListener('pointercancel', onCancel)
    container.removeEventListener('click', onClick, { capture: true })
    container.removeEventListener('wheel', onWheel)
  }
}
