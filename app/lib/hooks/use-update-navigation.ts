import { useState } from 'react'
import { useRevalidator } from 'react-router'

import { updateNavigation } from '~/apis/firestore/user'
import { rememberStartPage } from '~/lib/constants/navigation'
import { TUpdateNavigationRequest } from '~/lib/types/settings'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useUpdateNavigation = () => {
  const { revalidate } = useRevalidator()
  const [isPending, setIsPending] = useState(false)

  const mutate = async (data: TUpdateNavigationRequest) => {
    setIsPending(true)
    rememberStartPage(data.startPage)
    try {
      // Saved as it is chosen; the settings show the status instead of a toast.
      await updateNavigation(data)
      revalidate()
      return true
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        description: getErrorMessage(error),
      })
      return false
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
