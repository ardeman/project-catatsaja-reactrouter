import { useState } from 'react'

import { transcribeAudio } from '~/apis/ai/dictation'
import { TDictationKind } from '~/lib/types/ai'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useTranscribeAudio = () => {
  const [isPending, setIsPending] = useState(false)

  const mutate = async (
    audio: { mimeType: string; data: string },
    kind?: TDictationKind,
  ): Promise<string | undefined> => {
    setIsPending(true)
    try {
      return await transcribeAudio(audio, kind)
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
