import { CircleUser, ExternalLink, Lock, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { InstallApp } from '~/components/base/install-app'
import {
  NotificationCount,
  NotificationList,
  useNotifications,
} from '~/components/layouts/notifications'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from '~/components/ui/drawer'
import { appName } from '~/lib/constants/metadata'
import { useEncryptionSession } from '~/lib/hooks/use-encryption-session'
import { useUserData } from '~/lib/hooks/use-get-user'
import { TMenu } from '~/lib/types/common'
import { lockSession } from '~/lib/utils/encryption-session'

import { aboutMenus, isExternal, userMenus } from './constant'

const rowClassName = 'h-11 w-full justify-start gap-3 px-3 text-base'

// The phone's account tab: the person's avatar in the bottom tabs, opening a
// sheet with their notifications and the account menu (the bell and avatar
// menu of the wide top bar).
export const AccountSheet = (properties: {
  notifications: ReturnType<typeof useNotifications>
  onSignOut: () => void
}) => {
  const { notifications, onSignOut } = properties
  const { t } = useTranslation()
  const { data: userData } = useUserData()
  const encryption = useEncryptionSession()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const label =
    notifications.count > 0
      ? `${t('navigation.userMenu')}, ${notifications.label}`
      : t('navigation.userMenu')

  const menuLink = (menu: TMenu) => {
    const Icon = menu.icon
    return (
      <Button
        key={menu.href}
        asChild
        variant="ghost"
        className={rowClassName}
      >
        <Link
          to={menu.href}
          onClick={close}
          rel={isExternal(menu.href) ? 'noopener noreferrer' : undefined}
          target={isExternal(menu.href) ? '_blank' : undefined}
        >
          {Icon && <Icon className="text-muted-foreground" />}
          {menu.name}
          {isExternal(menu.href) && (
            <ExternalLink className="ml-auto text-muted-foreground" />
          )}
        </Link>
      </Button>
    )
  }

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          draggable={false}
          className="relative flex h-14 w-10 shrink-0 items-center justify-center rounded-full [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
        >
          <span className="relative">
            <Avatar className="size-8">
              <AvatarImage src={userData?.photoURL || ''} />
              <AvatarFallback>
                <CircleUser className="size-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <NotificationCount count={notifications.count} />
          </span>
        </button>
      </DrawerTrigger>
      <DrawerContent className="glass-surface glass-thick max-h-[85dvh] rounded-t-3xl [&>:first-child]:bg-foreground/20">
        <div className="grid gap-6 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="grid gap-0.5 px-1">
            <DrawerTitle className="truncate text-base">
              {userData?.displayName || t('navigation.userMenu')}
            </DrawerTitle>
            <DrawerDescription className="truncate">
              {userData?.email}
            </DrawerDescription>
          </div>
          <div className="grid gap-4">
            <NotificationList
              notifications={notifications}
              onClose={close}
            />
          </div>
          <nav
            aria-label={t('navigation.userMenu')}
            className="grid gap-1"
          >
            {userMenus(t).map((menu) => menuLink(menu))}
            <InstallApp>
              {({ onClick, label: installLabel, icon }) => (
                <Button
                  variant="ghost"
                  onClick={onClick}
                  className={`${rowClassName} [&_svg]:text-muted-foreground`}
                >
                  {icon}
                  {installLabel}
                </Button>
              )}
            </InstallApp>
            {userData?.publicKey && encryption.status === 'unlocked' && (
              <Button
                variant="ghost"
                onClick={() => {
                  close()
                  void lockSession()
                }}
                className={rowClassName}
              >
                <Lock className="text-muted-foreground" />
                {t('encryption.settings.lock')}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                close()
                onSignOut()
              }}
              className={rowClassName}
            >
              <LogOut className="text-muted-foreground" />
              {t('navigation.signOut')}
            </Button>
          </nav>
          <nav
            aria-label={appName}
            className="grid gap-1 border-t pt-4"
          >
            <p className="px-3 text-xs text-muted-foreground">{appName}</p>
            {aboutMenus(t).map((menu) => menuLink(menu))}
          </nav>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
