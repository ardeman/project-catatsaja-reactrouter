import { useEffect, useState } from 'react'

import { fetchKeyring, TKeyring } from '~/apis/firestore/keyring'

// The signed-in person's sealed keys (only they can read them): which
// passkeys can unlock.
export const useGetKeyring = (reloadKey?: unknown) => {
  const [data, setData] = useState<TKeyring>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true
    const load = async () => {
      try {
        const keyring = await fetchKeyring()
        if (isCurrent) setData(keyring)
      } catch {
        // Unlocking with the passphrase still works.
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }
    void load()
    return () => {
      isCurrent = false
    }
  }, [reloadKey])

  return { data, isLoading }
}
