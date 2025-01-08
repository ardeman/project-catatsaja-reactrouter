import { ReactNode, useEffect } from 'react'

type TProperties = {
  trigger: () => void
  condition?: boolean
  watch: ReactNode[]
}

export const useDebounce = (properties: TProperties) => {
  const { trigger, condition = true, watch } = properties
  useEffect(() => {
    const delayDebounceFunction = setTimeout(() => {
      if (condition) {
        trigger()
      }
    }, 500) // Delay in ms after typing has stopped

    return () => clearTimeout(delayDebounceFunction)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...watch])
}
