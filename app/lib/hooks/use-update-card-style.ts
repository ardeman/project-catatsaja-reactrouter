import { setCardStyle } from '~/apis/firestore/shared-document'
import { TCardStyle } from '~/lib/types/common'
import { TCollection } from '~/lib/utils/encrypted-document'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

// Giving a card a colour or a background emoji (or taking it away).
export const useUpdateCardStyle = () => {
  const mutate = async (
    name: TCollection,
    id: string,
    cardStyle: TCardStyle,
  ): Promise<void> => {
    try {
      await setCardStyle(name, id, cardStyle)
    } catch (error: unknown) {
      toast({ variant: 'destructive', description: getErrorMessage(error) })
    }
  }

  return { mutate }
}
