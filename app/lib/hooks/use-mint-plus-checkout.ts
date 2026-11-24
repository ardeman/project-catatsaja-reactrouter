import { httpsCallable } from 'firebase/functions'
import { useState } from 'react'

import { functions } from '~/lib/configs/functions'
import { useToast } from '~/lib/hooks/use-toast'
import { environment } from '~/lib/utils/environment'
import { getErrorMessage } from '~/lib/utils/firebase-error'

// Opens Dahlunas prepaid Plus checkout with a short-lived account token.
// No-op when VITE_PLUS_CHECKOUT_URL is unset (Buy stays hidden).
export const useMintPlusCheckout = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const checkoutUrl = environment.VITE_PLUS_CHECKOUT_URL?.trim()
  const canCheckout = Boolean(checkoutUrl && functions)

  const openCheckout = async () => {
    if (!checkoutUrl || !functions) return
    setLoading(true)
    try {
      const mint = httpsCallable<unknown, { token: string }>(
        functions,
        'mintPlusCheckout',
      )
      const { data } = await mint({})
      if (!data.token) throw new Error('failed-precondition')
      const url = new URL(checkoutUrl)
      url.searchParams.set('token', data.token)
      location.assign(url.href)
    } catch (error) {
      toast({
        variant: 'destructive',
        description: getErrorMessage(error),
      })
    } finally {
      setLoading(false)
    }
  }

  return { canCheckout, loading, openCheckout }
}
