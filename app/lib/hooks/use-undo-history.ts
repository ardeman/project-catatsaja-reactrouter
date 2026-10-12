import { useEffect, useRef, useState } from 'react'

// How long changes must pause before they become a step of their own.
const PAUSE = 800
// Steps kept back.
const LIMIT = 100

// Plain form data compares as JSON (the same in the same order).
const isSameJson = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b)

type THistory<TValue> = {
  key: string
  // Whether the value has caught up with the stored one since `key`
  // changed (the item loaded); until then changes are not steps.
  isLoaded: boolean
  past: TValue[]
  present: TValue
  future: TValue[]
}

// Undo and redo over a whole value (a note's title and text), in steps: a
// step is saved when changes pause, or at once with `checkpoint()` (around
// a change made for the person, such as an AI helper's). `undo` and `redo`
// return the value to show, which the caller applies.
//
// `key` starts over (another item was opened). `stored` is the saved value:
// the value first catching up with it (the item loading) is not a step.
export const useUndoHistory = <TValue>({
  key,
  value,
  stored,
  isEqual = isSameJson,
}: {
  key: string
  value: TValue
  stored: TValue
  isEqual?: (a: TValue, b: TValue) => boolean
}) => {
  const [history, setHistory] = useState<THistory<TValue>>({
    key,
    isLoaded: isEqual(value, stored),
    past: [],
    present: value,
    future: [],
  })
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Adjusted while rendering, the way React recommends for state that
  // follows props.
  if (history.key !== key) {
    setHistory({
      key,
      isLoaded: isEqual(value, stored),
      past: [],
      present: value,
      future: [],
    })
  } else if (!history.isLoaded && isEqual(value, stored)) {
    setHistory({ ...history, isLoaded: true, present: value })
  }

  const hasPending = history.isLoaded && !isEqual(value, history.present)

  // The history with `current` saved as a step, if it changed.
  const committed = (current: TValue): THistory<TValue> =>
    isEqual(current, history.present)
      ? history
      : {
          ...history,
          past: [...history.past, history.present].slice(-LIMIT),
          present: current,
          future: [],
        }

  // A pause saves the step.
  useEffect(() => {
    if (!hasPending) return
    timer.current = setTimeout(() => {
      setHistory((current) =>
        current.key !== key || isEqual(value, current.present)
          ? current
          : {
              ...current,
              past: [...current.past, current.present].slice(-LIMIT),
              present: value,
              future: [],
            },
      )
    }, PAUSE)
    return () => clearTimeout(timer.current)
  }, [value, hasPending, key, isEqual])

  const checkpoint = (current: TValue = value) => {
    clearTimeout(timer.current)
    setHistory(committed(current))
  }

  const undo = (current: TValue = value) => {
    clearTimeout(timer.current)
    const base = committed(current)
    const previous = base.past.at(-1)
    if (previous === undefined) return
    setHistory({
      ...base,
      past: base.past.slice(0, -1),
      present: previous,
      future: [base.present, ...base.future],
    })
    return previous
  }

  const redo = (current: TValue = value) => {
    clearTimeout(timer.current)
    const base = committed(current)
    const next = base.future[0]
    if (next === undefined) return
    setHistory({
      ...base,
      past: [...base.past, base.present],
      present: next,
      future: base.future.slice(1),
    })
    return next
  }

  return {
    canUndo: history.past.length > 0 || hasPending,
    canRedo: history.future.length > 0 && !hasPending,
    undo,
    redo,
    checkpoint,
  }
}
