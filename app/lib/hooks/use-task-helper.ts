import { useState } from 'react'

import { runTaskHelper } from '~/apis/ai/task'
import { TTaskHelper, TTaskHelperResult } from '~/lib/types/task'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useTaskHelper = () => {
  const [pending, setPending] = useState<TTaskHelper>()

  const mutate = async (data: {
    helper: TTaskHelper
    title: string
    content: { checked: boolean; item: string }[]
    text?: string
  }): Promise<TTaskHelperResult | undefined> => {
    setPending(data.helper)
    try {
      return await runTaskHelper(data)
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        description: getErrorMessage(error),
      })
      return undefined
    } finally {
      setPending(undefined)
    }
  }

  return { mutate, pending }
}
