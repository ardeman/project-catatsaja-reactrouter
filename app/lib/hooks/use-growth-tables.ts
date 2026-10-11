import { useEffect, useState } from 'react'

import {
  growthSourceOn,
  TGrowthReference,
  TGrowthStandards,
  TGrowthTables,
} from '~/lib/utils/growth'

// Each WHO table is a separate file, not part of the app's first load,
// fetched once the first time it is needed.
const once = <TTable>(load: () => Promise<TTable>) => {
  let cache: Promise<TTable> | undefined
  return async () => {
    cache ??= load()
    try {
      return await cache
    } catch (error) {
      // Offline before it ever loaded: try again next time.
      cache = undefined
      throw error
    }
  }
}

const loadStandards = once<TGrowthStandards>(async () => {
  const module = await import('~/lib/constants/who-growth-standards')
  return module.whoGrowthStandards
})

const loadReference = once<TGrowthReference>(async () => {
  const module = await import('~/lib/constants/who-growth-reference')
  return module.whoGrowthReference
})

const useTable = <TTable>(isNeeded: boolean, load: () => Promise<TTable>) => {
  const [table, setTable] = useState<TTable>()

  useEffect(() => {
    if (!isNeeded) return
    let isCurrent = true
    const run = async () => {
      try {
        const loaded = await load()
        if (isCurrent) setTable(loaded)
      } catch {
        // Shown as still loading; the next visit tries again.
      }
    }
    void run()
    return () => {
      isCurrent = false
    }
  }, [isNeeded, load])

  return table
}

// The WHO growth tables for the ages shown (in days since birth): the
// birth-to-5 standards and the 5-to-19 reference, each loaded only when
// one of the ages needs it. `isLoaded` once all the ones needed are in.
export const useGrowthTables = (
  days: number[],
): TGrowthTables & { isLoaded: boolean } => {
  const sources = new Set(days.map((day) => growthSourceOn(day)))
  const isNeedsStandards = sources.has('standards')
  const isNeedsReference = sources.has('reference')
  const standards = useTable(isNeedsStandards, loadStandards)
  const reference = useTable(isNeedsReference, loadReference)
  return {
    standards,
    reference,
    isLoaded:
      (!isNeedsStandards || !!standards) && (!isNeedsReference || !!reference),
  }
}
