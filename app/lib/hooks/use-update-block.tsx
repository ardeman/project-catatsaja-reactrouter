import { useTranslation } from 'react-i18next'

import { blockUser, unblockUser } from '~/apis/firestore/blocked'
import { declineInvite } from '~/apis/firestore/shared-document'
import { ToastAction } from '~/components/ui/toast'
import { TInvitation } from '~/lib/types/common'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

// Blocking someone (no more invitations from them, and the ones waiting are
// declined) or unblocking them. Items already accepted from them stay.
export const useUpdateBlock = () => {
  const { t } = useTranslation()

  const unblock = async (uid: string) => {
    try {
      await unblockUser(uid)
      toast({ description: t('block.toast.unblocked') })
    } catch (error: unknown) {
      toast({ variant: 'destructive', description: getErrorMessage(error) })
    }
  }

  const block = async (uid: string, waiting: TInvitation[] = []) => {
    try {
      await blockUser(uid)
      for (const invitation of waiting) {
        if (invitation.owner !== uid) continue
        await declineInvite(
          invitation.name,
          invitation.id,
          invitation.isEncrypted,
        )
      }
      toast({
        description: t('block.toast.blocked'),
        action: (
          <ToastAction
            altText={t('form.undo')}
            onClick={() => void unblock(uid)}
          >
            {t('form.undo')}
          </ToastAction>
        ),
      })
    } catch (error: unknown) {
      toast({ variant: 'destructive', description: getErrorMessage(error) })
    }
  }

  return { block, unblock }
}
