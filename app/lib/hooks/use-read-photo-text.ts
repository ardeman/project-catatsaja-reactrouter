import { useState } from 'react'

import { readPhotoText } from '~/apis/ai/photo-text'
import { TDictationKind } from '~/lib/types/ai'
import { getErrorMessage } from '~/lib/utils/firebase-error'
import { shrinkImage } from '~/lib/utils/image'

import { toast } from './use-toast'

export const useReadPhotoText = () => {
  const [isPending, setIsPending] = useState(false)

  const mutate = async (
    file: File,
    kind?: TDictationKind,
  ): Promise<string | undefined> => {
    setIsPending(true)
    try {
      let image
      try {
        // Larger than for receipts, so small print and handwriting stay legible.
        image = await shrinkImage(file, 2048)
      } catch {
        throw new Error('image/unreadable')
      }
      return await readPhotoText(image, kind)
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
