import { useRevalidator } from 'react-router'

import { updateAiConsent } from '~/apis/firestore/user'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useUpdateAiConsent = () => {
  const { revalidate } = useRevalidator()

  const mutate = async (aiConsent: boolean) => {
    try {
      await updateAiConsent(aiConsent)
      revalidate()
      return true
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        description: getErrorMessage(error),
      })
      return false
    }
  }

  return { mutate }
}
