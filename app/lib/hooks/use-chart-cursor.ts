import { KeyboardEvent, useState } from 'react'

// Which data point a chart's readout shows: set by pointer (hover or tap)
// and by the arrow keys while the chart has focus, the same details either
// way.
export const useChartCursor = (count: number) => {
  const [index, setIndex] = useState<number>()

  const onKeyDown = (event: KeyboardEvent) => {
    if (count === 0) return
    const last = count - 1
    const moves = new Map([
      ['ArrowLeft', Math.max((index ?? count) - 1, 0)],
      ['ArrowRight', Math.min((index ?? -1) + 1, last)],
      ['Home', 0],
      ['End', last],
    ])
    if (event.key === 'Escape') {
      setIndex(undefined)
      return
    }
    const next = moves.get(event.key)
    if (next === undefined) return
    event.preventDefault()
    setIndex(next)
  }

  return {
    index: index !== undefined && index < count ? index : undefined,
    setIndex,
    // Props for the focusable chart element.
    focusProps: {
      tabIndex: 0,
      onKeyDown,
      onFocus: () => setIndex((current) => current ?? count - 1),
      onBlur: () => setIndex(undefined),
      onPointerLeave: () => setIndex(undefined),
    },
  }
}
