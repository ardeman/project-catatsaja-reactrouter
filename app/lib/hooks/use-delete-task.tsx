import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { deleteTask } from '~/apis/firestore/task'
import { ToastAction } from '~/components/ui/toast'
import { TTaskResponse } from '~/lib/types/task'

import { useCreateTask } from './use-create-task'
import { toast } from './use-toast'

export const useDeleteTask = () => {
  const [isPending, setIsPending] = useState(false)
  const { mutate: mutateCreateTask } = useCreateTask()
  const { t } = useTranslation()

  const mutate = async (task: TTaskResponse) => {
    setIsPending(true)
    try {
      const { isPinned: _isPinned, id: _id, ...data } = task
      await deleteTask(task)
      toast({
        description: t('notes.toast.deleted'),
        action: (
          <ToastAction
            altText="Undo"
            onClick={() => mutateCreateTask(data)}
          >
            {t('form.undo')}
          </ToastAction>
        ),
      })
    } catch (error: unknown) {
      const message = String(error)
      toast({
        variant: 'destructive',
        description: message,
      })
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
