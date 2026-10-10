import { useState } from 'react'
import { useRevalidator } from 'react-router'

import { updateHealthSettings } from '~/apis/firestore/user'
import { TUpdateHealthSettingsRequest } from '~/lib/types/settings'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useUpdateHealthSettings = () => {
  const { revalidate } = useRevalidator()
  const [isPending, setIsPending] = useState(false)

  const mutate = async (data: TUpdateHealthSettingsRequest) => {
    setIsPending(true)
    try {
      // Saved as it is chosen; the settings show the status instead of a toast.
      await updateHealthSettings(data)
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
