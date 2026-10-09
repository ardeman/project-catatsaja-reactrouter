import { useCallback, useEffect, useRef, type DependencyList } from 'react'

type TProperties = {
  save: () => unknown
  watch: DependencyList
  delay?: number
  // false: save only when leaving (used while creating, so the page does not
  // switch to the new item in the middle of typing).
  saveWhenIdle?: boolean
}

/**
 * Calls `save` once `watch` has stopped changing for `delay` ms, and always
 * once more when the component unmounts (Back, a link, another route), so
 * `save` must only write what differs from the stored copy. The browser asks
 * before the tab closes while a change is waiting.
 */
export const useAutosave = (properties: TProperties) => {
  const { save, watch, delay = 500, saveWhenIdle = true } = properties
  const saveReference = useRef(save)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const pending = useRef(false)
  const isFirstRun = useRef(true)

  useEffect(() => {
    saveReference.current = save
  })

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    if (!pending.current) return
    pending.current = false
    void saveReference.current()
  }, [])

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    pending.current = true
    clearTimeout(timer.current)
    if (saveWhenIdle) timer.current = setTimeout(flush, delay)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, watch)

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!pending.current) return
      flush()
      event.preventDefault()
    }
    globalThis.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      globalThis.removeEventListener('beforeunload', handleBeforeUnload)
      clearTimeout(timer.current)
      pending.current = false
      void saveReference.current()
    }
  }, [flush])

  return { flush }
}
