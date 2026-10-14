// Read the caret before replacing the item text with its editing textarea.
export const getClickedCaret = (element: HTMLElement, x: number, y: number) => {
  const position = document.caretPositionFromPoint?.(x, y)
  const legacyDocument = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null
  }
  const legacyRange = position
    ? undefined
    : legacyDocument.caretRangeFromPoint?.(x, y)
  const node = position?.offsetNode ?? legacyRange?.startContainer
  const offset = position?.offset ?? legacyRange?.startOffset
  const range = document.createRange()
  if (node && offset !== undefined && element.contains(node)) {
    range.selectNodeContents(element)
    range.setEnd(node, offset)
    return range.toString().length
  }

  // Some browsers cannot hit-test button text, or return a node outside it
  // for clicks in padding. Pick the nearest caret on the nearest text line.
  const text = element.firstChild
  if (!(text instanceof Text)) return 0
  let nearest = 0
  let verticalDistance = Infinity
  let horizontalDistance = Infinity
  for (let index = 0; index <= text.length; index++) {
    range.setStart(text, index)
    range.setEnd(text, Math.min(index + 1, text.length))
    const rectangle = range.getBoundingClientRect()
    if (rectangle.height === 0) continue
    const vertical = Math.max(rectangle.top - y, y - rectangle.bottom, 0)
    const horizontal = Math.abs(rectangle.left - x)
    if (!(
      vertical < verticalDistance ||
      (vertical === verticalDistance && horizontal < horizontalDistance)
    )) {
      continue
    }

    nearest = index
    verticalDistance = vertical
    horizontalDistance = horizontal
  }
  return nearest
}
