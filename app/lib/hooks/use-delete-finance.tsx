import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { deleteFinance } from '~/apis/firestore/finance'
import { ToastAction } from '~/components/ui/toast'
import { TFinanceResponse } from '~/lib/types/finance'

import { useCreateFinance } from './use-create-finance'
import { toast } from './use-toast'

export const useDeleteFinance = () => {
  const [isPending, setIsPending] = useState(false)
  const { mutate: mutateCreateFinance } = useCreateFinance()
  const { t } = useTranslation()

  const mutate = async (finance: TFinanceResponse) => {
    setIsPending(true)
    try {
      const { isPinned: _isPinned, id: _id, ...data } = finance
      await deleteFinance(finance)
      toast({
        description: t('finances.toast.deleted'),
        action: (
          <ToastAction
            altText="Undo"
            onClick={() => mutateCreateFinance(data)}
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
