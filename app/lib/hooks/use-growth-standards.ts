import { useEffect, useState } from 'react'

import { loadGrowthStandards, TGrowthStandards } from '~/lib/utils/growth'

let cache: Promise<TGrowthStandards> | undefined

// The WHO growth tables, loaded the first time a child's growth is shown
// (they are a separate file, not part of the app's first load).
export const useGrowthStandards = (isNeeded: boolean) => {
  const [standards, setStandards] = useState<TGrowthStandards>()

  useEffect(() => {
    if (!isNeeded) return
    let isCurrent = true
    const load = async () => {
      cache ??= loadGrowthStandards()
      try {
        const loaded = await cache
        if (isCurrent) setStandards(loaded)
      } catch {
        // Offline before it ever loaded: try again next time.
        cache = undefined
      }
    }
    void load()
    return () => {
      isCurrent = false
    }
  }, [isNeeded])

  return standards
}
