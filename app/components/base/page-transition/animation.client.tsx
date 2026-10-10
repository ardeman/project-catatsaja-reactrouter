export const animatePage = (container: HTMLDivElement | null) => {
  const page = container?.firstElementChild
  if (
    !page ||
    !('animate' in page) ||
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return

  // Opacity avoids changing the containing block of sticky navigation.
  const animation = page.animate([{ opacity: 0.75 }, { opacity: 1 }], {
    duration: 180,
    easing: 'ease-out',
  })
  return () => animation.cancel()
}
