import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '~/components/ui/button'
import { navIcons } from '~/lib/constants/navigation'
import { useGetPendingInvitations } from '~/lib/hooks/use-get-pending-invitations'
import { useUpdateBlock } from '~/lib/hooks/use-update-block'
import { useUpdateInvitation } from '~/lib/hooks/use-update-invitation'
import { TInvitation } from '~/lib/types/common'
import { TUserResponse } from '~/lib/types/user'

// Where each kind of item lives in the app.
const pages = {
  notes: 'notes',
  tasks: 'tasks',
  finances: 'finances',
  healthLogs: 'health',
} as const satisfies Record<TInvitation['name'], keyof typeof navIcons>

type TItemProperties = {
  invitation: TInvitation
  invitations: TInvitation[]
  owner?: TUserResponse
  // Called once the invitation is answered, before an accepted item opens.
  onAnswered?: () => void
}

// One invitation, with what it is, who sent it and the answers.
export const InvitationItem = (properties: TItemProperties) => {
  const { invitation, invitations, owner, onAnswered } = properties
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { accept, decline, pendingId } = useUpdateInvitation()
  const { block } = useUpdateBlock()
  const page = pages[invitation.name]
  const Icon = navIcons[page]
  const isPending = pendingId === invitation.id
  const item = invitation.title
    ? t(`invitations.kind.${page}.titled`, { title: invitation.title })
    : t(`invitations.kind.${page}.untitled`)
  return (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Icon
          aria-hidden="true"
          className="size-4"
        />
      </span>
      <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
        <p className="text-sm">
          {t('invitations.message', {
            name:
              owner?.displayName || owner?.email || t('invitations.someone'),
            item,
          })}
        </p>
        <p className="text-xs text-muted-foreground">
          {t(
            invitation.access === 'write'
              ? 'form.permissions.write'
              : 'form.permissions.readOnly',
          )}
        </p>
      </div>
      <div className="ml-auto flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          title={t('block.hint')}
          className="text-destructive-text hover:text-destructive-text"
          onClick={() => void block(invitation.owner, invitations)}
        >
          {t('block.action')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={async () => {
            if (await decline(invitation)) onAnswered?.()
          }}
        >
          {t('invitations.decline')}
        </Button>
        <Button
          size="sm"
          disabled={isPending}
          onClick={async () => {
            if (!(await accept(invitation))) return
            onAnswered?.()
            void navigate(`/${page}/${invitation.id}`)
          }}
        >
          {t('invitations.accept')}
        </Button>
      </div>
    </>
  )
}

// Items shared with the person that wait for them to accept, at the top of
// every list page and in the notifications: nothing shared appears in their
// lists until they do. Accepting opens the item; declining removes the
// invitation for good; blocking also stops that person inviting them again
// (until unblocked in Settings → Account).
export const Invitations = () => {
  const { t } = useTranslation()
  const { invitations, owners } = useGetPendingInvitations()

  if (invitations.length === 0) return null

  return (
    <section
      aria-labelledby="invitations-title"
      className="mx-auto grid w-full max-w-6xl gap-2"
    >
      <h2
        id="invitations-title"
        className="sr-only"
      >
        {t('invitations.title')}
      </h2>
      <ul className="grid gap-2">
        {invitations.map((invitation) => (
          <li
            key={`${invitation.name}/${invitation.id}`}
            className="glass-surface motion-enter flex flex-wrap items-center gap-3 rounded-xl border p-3"
          >
            <InvitationItem
              invitation={invitation}
              invitations={invitations}
              owner={owners?.find((user) => user.uid === invitation.owner)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
