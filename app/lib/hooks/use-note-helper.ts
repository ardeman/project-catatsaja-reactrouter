import { useState } from 'react'

import { runNoteHelper } from '~/apis/ai/note'
import { TNoteHelper, TNoteHelperResult } from '~/lib/types/note'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useNoteHelper = () => {
  const [pending, setPending] = useState<TNoteHelper>()

  const mutate = async (data: {
    helper: TNoteHelper
    title: string
    content: string
  }): Promise<TNoteHelperResult | undefined> => {
    setPending(data.helper)
    try {
      return await runNoteHelper(data)
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
