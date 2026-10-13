import { CircleUser } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/base/card'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { useGetBlocked } from '~/lib/hooks/use-get-blocked'
import { useGetUsers } from '~/lib/hooks/use-get-users'
import { useUpdateBlock } from '~/lib/hooks/use-update-block'

// People the person blocked from inviting them, to unblock.
export const Blocked = () => {
  const { t } = useTranslation()
  const { data: blockedIds } = useGetBlocked()
  const { data: people } = useGetUsers(blockedIds ?? [])
  const { unblock } = useUpdateBlock()

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{t('block.settings.title')}</CardTitle>
        <CardDescription>{t('block.settings.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {(blockedIds ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('block.settings.empty')}
          </p>
        ) : (
          <ul className="grid gap-3">
            {(blockedIds ?? []).map((uid) => {
              const person = people?.find((user) => user.uid === uid)
              return (
                <li
                  key={uid}
                  className="flex min-w-0 items-center gap-3"
                >
                  <Avatar className="size-8">
                    <AvatarImage src={person?.photoURL} />
                    <AvatarFallback>
                      <CircleUser className="size-5" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-sm">
                      {person?.displayName ||
                        person?.email ||
                        t('invitations.someone')}
                    </span>
                    {person?.displayName && (
                      <span className="truncate text-xs text-muted-foreground">
                        {person.email}
                      </span>
                    )}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void unblock(uid)}
                  >
                    {t('block.settings.unblock')}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
