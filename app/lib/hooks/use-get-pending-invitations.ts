import { useGetBlocked } from './use-get-blocked'
import { useGetInvitations } from './use-get-invitations'
import { useGetUsers } from './use-get-users'

// The invitations waiting for an answer, with the people who sent them.
// From someone blocked meanwhile: declined as they are blocked, hidden
// until then.
export const useGetPendingInvitations = () => {
  const { data } = useGetInvitations()
  const { data: blocked } = useGetBlocked()
  const invitations = (data ?? []).filter(
    (invitation) => !blocked?.includes(invitation.owner),
  )
  const { data: owners } = useGetUsers([
    ...new Set(invitations.map((invitation) => invitation.owner)),
  ])
  return { invitations, owners }
}
