import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/base/card'
import { ChoiceCards } from '~/components/base/choice-cards'
import { SaveStatus, TSaveStatus } from '~/components/base/save-status'
import { Button } from '~/components/ui/button'
import {
  navs,
  orderNavPages,
  readStartPage,
  TNavPage,
} from '~/lib/constants/navigation'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateNavigation } from '~/lib/hooks/use-update-navigation'
import { TUpdateNavigationRequest } from '~/lib/types/settings'

// The menu's order and the page the app opens on. Each change applies and
// saves right away, like the appearance settings.
export const Navigation = () => {
  const { t } = useTranslation()
  const { data: userData } = useUserData()
  const { mutate } = useUpdateNavigation()
  const [status, setStatus] = useState<TSaveStatus>('idle')
  const [choice, setChoice] = useState<TUpdateNavigationRequest>(() => ({
    navOrder: orderNavPages(userData?.navOrder),
    startPage: userData?.startPage ?? readStartPage(),
  }))
  // The latest choice, so quick changes in a row each save both.
  const latest = useRef(choice)

  useEffect(() => {
    if (!userData) return
    const next = {
      navOrder: orderNavPages(userData.navOrder ?? latest.current.navOrder),
      startPage: userData.startPage ?? latest.current.startPage,
    }
    latest.current = next
    setChoice(next)
  }, [userData])

  const save = async (change: Partial<TUpdateNavigationRequest>) => {
    const next = { ...latest.current, ...change }
    latest.current = next
    setChoice(next)
    setStatus('saving')
    const isSaved = await mutate(next)
    setStatus(isSaved ? 'saved' : 'error')
  }

  const move = (index: number, offset: -1 | 1) => {
    const order = [...latest.current.navOrder]
    const [page] = order.splice(index, 1)
    order.splice(index + offset, 0, page)
    void save({ navOrder: order })
  }

  const items = navs(t, choice.navOrder)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          {t('settings.navigation.title')}
          <span className="text-xs font-normal text-muted-foreground">
            <SaveStatus status={status} />
          </span>
        </CardTitle>
        <CardDescription>
          {t('settings.navigation.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2">
          <h3 className="text-sm leading-none font-medium">
            {t('settings.navigation.order')}
          </h3>
          <ol className="grid divide-y rounded-lg border">
            {items.map((nav, index) => {
              const Icon = nav.icon
              return (
                <li
                  key={nav.href}
                  className="motion-enter flex items-center gap-3 py-1 pr-1 pl-3"
                >
                  {Icon && (
                    <Icon
                      aria-hidden="true"
                      className="size-4 text-muted-foreground"
                    />
                  )}
                  <span className="flex-1 text-sm">{nav.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`${t('actions.moveUp')}: ${nav.name}`}
                    title={t('actions.moveUp')}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`${t('actions.moveDown')}: ${nav.name}`}
                    title={t('actions.moveDown')}
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </li>
              )
            })}
          </ol>
        </div>
        <ChoiceCards<TNavPage>
          label={t('settings.navigation.startPage')}
          hint={t('settings.navigation.startPageHint')}
          value={choice.startPage}
          onChange={(value) => void save({ startPage: value })}
          className="grid-cols-3"
          options={choice.navOrder.map((page) => {
            const nav = items.find((item) => item.href === `/${page}`)
            const Icon = nav?.icon
            return {
              value: page,
              label: nav?.name,
              visual: Icon && <Icon className="size-5" />,
            }
          })}
        />
      </CardContent>
    </Card>
  )
}
