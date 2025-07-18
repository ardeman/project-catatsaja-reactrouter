import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { createTask } from '~/apis/firestore/task'
import { TCreateTaskRequest } from '~/lib/types/task'

import { toast } from './use-toast'

export const useCreateTask = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const { t } = useTranslation()

  const mutate = async (data: TCreateTaskRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      const reference = await createTask(data)
      toast({
        description: t('tasks.toast.created'),
      })
      return reference
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
