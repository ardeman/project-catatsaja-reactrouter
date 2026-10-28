import {
  CircleUser,
  ExternalLink,
  Lock,
  LogOut,
  Search as SearchIcon,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { useMediaQuery } from 'usehooks-ts'

import { InstallApp } from '~/components/base/install-app'
import {
  Notifications,
  useNotifications,
} from '~/components/layouts/notifications'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { appName } from '~/lib/constants/metadata'
import { useEncryptionSession } from '~/lib/hooks/use-encryption-session'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useLogout } from '~/lib/hooks/use-logout'
import { TMenu } from '~/lib/types/common'
import { lockSession } from '~/lib/utils/encryption-session'
import { cn } from '~/lib/utils/shadcn'

import { AccountSheet } from './account-sheet'
import { aboutMenus, isExternal, userMenus } from './constant'
import { Navigation } from './navigation'
import { Search } from './search'
import { TProperties } from './type'
export { aboutMenus } from './constant'

const MenuLink = (properties: { menu: TMenu }) => {
  const { menu } = properties
  const Icon = menu.icon
  return (
    <DropdownMenuItem
      asChild
      className="cursor-pointer gap-2"
    >
      <Link
        to={menu.href}
        rel={isExternal(menu.href) ? 'noopener noreferrer' : undefined}
        target={isExternal(menu.href) ? '_blank' : undefined}
      >
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        {menu.name}
        {isExternal(menu.href) && (
          <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
        )}
      </Link>
    </DropdownMenuItem>
  )
}

export const Navbar = (properties: TProperties) => {
  const { className } = properties
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: userData } = useUserData()
  const encryption = useEncryptionSession()
  const handleLogout = () => {
    mutateLogout()
    navigate('/', { replace: true })
  }

  const { mutate: mutateLogout } = useLogout()
  const notifications = useNotifications()
  // Phones have no top bar: the pages are bottom tabs, beside an account tab
  // and a Search button that brings the search box down from the top.
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const searchReference = useRef<HTMLInputElement>(null)
  const [isSearching, setIsSearching] = useState(false)

  return (
    <>
      <header
        className={cn(
          'top-0 z-50 flex h-16 w-full items-center gap-4 px-4 md:sticky md:px-6',
          'max-md:fixed max-md:h-[calc(4rem+env(safe-area-inset-top))] max-md:pt-[env(safe-area-inset-top)] max-md:motion-safe:transition-[translate,opacity] max-md:motion-safe:duration-200',
          !isSearching &&
            'max-md:pointer-events-none max-md:-translate-y-full max-md:opacity-0',
          className,
        )}
      >
        {/* Keep blur off the ancestor so search can blur the page behind it. */}
        <div
          aria-hidden="true"
          className="glass-surface pointer-events-none absolute inset-0 -z-10 border-b"
        />
        <Navigation className="hidden shrink-0 flex-col md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6" />
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <Search
            inputReference={searchReference}
            onFocusChange={setIsSearching}
          />
          {isDesktop && <Notifications notifications={notifications} />}
          {isDesktop && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="shrink-0 rounded-full [&_svg]:size-6"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userData?.photoURL || ''} />
                    <AvatarFallback>
                      <CircleUser />
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">{t('navigation.userMenu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="glass-surface w-60"
              >
                <DropdownMenuLabel className="grid font-normal">
                  {userData?.displayName && (
                    <span className="truncate font-medium">
                      {userData.displayName}
                    </span>
                  )}
                  <span className="truncate text-xs text-muted-foreground">
                    {userData?.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userMenus(t).map((menu) => (
                  <MenuLink
                    key={menu.href}
                    menu={menu}
                  />
                ))}
                <InstallApp>
                  {({ onClick, label, icon }) => (
                    <DropdownMenuItem
                      onClick={onClick}
                      className="cursor-pointer gap-2 [&_svg]:text-muted-foreground"
                    >
                      {icon}
                      {label}
                    </DropdownMenuItem>
                  )}
                </InstallApp>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  {appName}
                </DropdownMenuLabel>
                {aboutMenus(t).map((menu) => (
                  <MenuLink
                    key={menu.href}
                    menu={menu}
                  />
                ))}
                <DropdownMenuSeparator />
                {userData?.publicKey && encryption.status === 'unlocked' && (
                  <DropdownMenuItem
                    onClick={() => void lockSession()}
                    className="cursor-pointer gap-2"
                  >
                    <Lock className="size-4 text-muted-foreground" />
                    {t('encryption.settings.lock')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer gap-2"
                >
                  <LogOut className="size-4 text-muted-foreground" />
                  {t('navigation.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      {!isDesktop && (
        <div className="fixed inset-x-2 bottom-(--nav-bottom) z-50 flex gap-1.5">
          <Navigation
            variant="bottom"
            className="glass-surface flex min-w-0 flex-1 gap-0 rounded-full border p-1"
            trailing={
              <AccountSheet
                notifications={notifications}
                onSignOut={handleLogout}
              />
            }
          />
          <button
            type="button"
            aria-label={t('navigation.search.placeholder')}
            title={t('navigation.search.placeholder')}
            onClick={() => {
              // In the tap itself, or the phone won't open its keyboard.
              searchReference.current?.focus()
              searchReference.current?.select()
            }}
            // As tall as the pill: its tabs plus padding and border.
            className="glass-surface flex size-[calc(4rem+2px)] shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
          >
            <SearchIcon
              aria-hidden="true"
              className="size-5"
            />
          </button>
        </div>
      )}
    </>
  )
}
