import { useState } from 'react'

import { transcribeAudio } from '~/apis/ai/dictation'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useTranscribeAudio = () => {
  const [isPending, setIsPending] = useState(false)

  const mutate = async (audio: {
    mimeType: string
    data: string
  }): Promise<string | undefined> => {
    setIsPending(true)
    try {
      return await transcribeAudio(audio)
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        description: getErrorMessage(error),
      })
      return undefined
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
