import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { unlinkTask } from '~/apis/firestore/task'
import { TTaskResponse } from '~/lib/types/task'

import { toast } from './use-toast'

export const useUnlinkTask = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const { t } = useTranslation()

  const mutate = async (data: TTaskResponse) => {
    setIsPending(true)
    setIsError(false)
    try {
      await unlinkTask(data)
      toast({
        description: t('tasks.toast.unlinked'),
      })
    } catch (error: unknown) {
      setIsError(true)
      const message = String(error)
      toast({
        variant: 'destructive',
        description: message,
      })
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending, isError }
}
