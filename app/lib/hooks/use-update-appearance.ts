import { useState } from 'react'
import { useRevalidator } from 'react-router'

import { updateAppearance } from '~/apis/firestore/user'
import { TUpdateAppearanceRequest } from '~/lib/types/settings'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useUpdateAppearance = () => {
  const { revalidate } = useRevalidator()
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const mutate = async (data: TUpdateAppearanceRequest) => {
    setIsPending(true)
    setIsError(false)
    setIsSuccess(false)
    try {
      // Saved as it is chosen; the settings show the status instead of a toast.
      await updateAppearance(data)
      setIsSuccess(true)
      revalidate()
      return true
    } catch (error: unknown) {
      setIsError(true)
      const message = getErrorMessage(error)
      toast({
        variant: 'destructive',
        description: message,
      })
      return false
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending, isError, isSuccess }
}
