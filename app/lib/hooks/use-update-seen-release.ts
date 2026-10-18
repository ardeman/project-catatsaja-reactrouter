import { useRevalidator } from 'react-router'

import { updateSeenRelease } from '~/apis/firestore/user'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useUpdateSeenRelease = () => {
  const { revalidate } = useRevalidator()

  const mutate = async (date: string) => {
    try {
      await updateSeenRelease(date)
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
