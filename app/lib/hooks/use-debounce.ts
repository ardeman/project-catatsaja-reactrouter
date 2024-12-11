import { ReactNode, useEffect } from 'react'

type TProps = {
  trigger: () => void
  condition?: boolean
  watch: ReactNode[]
}

export const useDebounce = (props: TProps) => {
  const { trigger, condition = true, watch } = props
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (condition) {
        trigger()
      }
    }, 500) // Delay in ms after typing has stopped

    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...watch])
}
