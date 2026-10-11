import { useCallback } from 'react'

import { encryptOwnItems } from '~/apis/firestore/shared-document'

// Encrypting the person's own plain items in the background (on each
// unlocked visit): items shared with people who haven't turned encryption
// on wait for them. Failures are tried again next time.
export const useEncryptOwnItems = () =>
  useCallback(async () => {
    try {
      return await encryptOwnItems()
    } catch {
      return { encrypted: 0, waiting: 0 }
    }
  }, [])
