import { useTranslation } from 'react-i18next'

import { setArchived } from '~/apis/firestore/shared-document'
import { ToastAction } from '~/components/ui/toast'
import { TCollection } from '~/lib/utils/encrypted-document'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

// Archiving an item for the person (or bringing it back), with an undo in
// the toast: archiving only moves it out of their main list.
export const useUpdateArchive = () => {
  const { t } = useTranslation()

  const mutate = async (
    name: TCollection,
    id: string,
    isArchived: boolean,
  ): Promise<void> => {
    try {
      await setArchived(name, id, isArchived)
      toast({
        description: t(
          isArchived ? 'archive.toast.archived' : 'archive.toast.restored',
        ),
        action: (
          <ToastAction
            altText={t('form.undo')}
            onClick={() => void mutate(name, id, !isArchived)}
          >
            {t('form.undo')}
          </ToastAction>
        ),
      })
    } catch (error: unknown) {
      toast({ variant: 'destructive', description: getErrorMessage(error) })
    }
  }

  return { mutate }
}
