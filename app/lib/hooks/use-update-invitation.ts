import { useState } from 'react'

import { acceptInvite, declineInvite } from '~/apis/firestore/shared-document'
import { TInvitation } from '~/lib/types/common'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

// Accepting or declining an invitation; the one being answered is pending.
export const useUpdateInvitation = () => {
  const [pendingId, setPendingId] = useState<string>()

  const run = async (invitation: TInvitation, answer: () => Promise<void>) => {
    setPendingId(invitation.id)
    try {
      await answer()
      return true
    } catch (error: unknown) {
      toast({ variant: 'destructive', description: getErrorMessage(error) })
      return false
    } finally {
      setPendingId(undefined)
    }
  }

  const accept = (invitation: TInvitation) =>
    run(invitation, () =>
      acceptInvite(invitation.name, invitation.id, invitation.access),
    )

  const decline = (invitation: TInvitation) =>
    run(invitation, () =>
      declineInvite(invitation.name, invitation.id, invitation.isEncrypted),
    )

  return { accept, decline, pendingId }
}
