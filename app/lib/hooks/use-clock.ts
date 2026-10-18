import { useEffect, useState } from 'react'

import { today } from '~/lib/utils/finance'

const read = () => ({
  today: today(),
  // HH:MM in the person's time zone.
  now: new Date().toTimeString().slice(0, 5),
})

// Today's date and the time, kept current each minute, so a dose shows as
// due while the page is open.
export const useClock = () => {
  const [clock, setClock] = useState(read)
  useEffect(() => {
    const timer = setInterval(() => {
      const next = read()
      setClock((current) =>
        current.now === next.now && current.today === next.today
          ? current
          : next,
      )
    }, 15_000)
    return () => clearInterval(timer)
  }, [])
  return clock
}
