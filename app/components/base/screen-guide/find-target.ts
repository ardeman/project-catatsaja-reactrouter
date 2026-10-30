// The first control on screen with this marker. Phones and computers place
// some controls twice (search, the account menu), with one of them hidden.
export const findTarget = (target: string) =>
  [
    ...document.querySelectorAll<HTMLElement>(
      `[data-guide="${CSS.escape(target)}"]`,
    ),
  ].find((element) => {
    const { width, height } = element.getBoundingClientRect()
    if (width === 0 || height === 0) return false
    return (
      element.checkVisibility?.({
        opacityProperty: true,
        visibilityProperty: true,
      }) ?? true
    )
  })
