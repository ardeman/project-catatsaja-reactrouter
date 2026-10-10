import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { deleteHealthLog } from '~/apis/firestore/health-log'
import { ToastAction } from '~/components/ui/toast'
import { THealthLogResponse } from '~/lib/types/health'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { useCreateHealthLog } from './use-create-health-log'
import { toast } from './use-toast'

export const useDeleteHealthLog = () => {
  const [isPending, setIsPending] = useState(false)
  const { mutate: mutateCreateHealthLog } = useCreateHealthLog()
  const { t } = useTranslation()

  const mutate = async (healthLog: THealthLogResponse) => {
    setIsPending(true)
    try {
      const { isPinned: _isPinned, id: _id, ...data } = healthLog
      await deleteHealthLog(healthLog)
      toast({
        description: t('health.toast.deleted'),
        action: (
          <ToastAction
            altText={t('form.undo')}
            onClick={() => mutateCreateHealthLog(data)}
          >
            {t('form.undo')}
          </ToastAction>
        ),
      })
    } catch (error: unknown) {
      const message = getErrorMessage(error)
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
