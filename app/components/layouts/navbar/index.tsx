import { CircleUser, ExternalLink, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { InstallApp } from '~/components/base/install-app'
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
import { useUserData } from '~/lib/hooks/use-get-user'
import { useLogout } from '~/lib/hooks/use-logout'
import { TMenu } from '~/lib/types/common'
import { cn } from '~/lib/utils/shadcn'

import { aboutMenus, userMenus } from './constant'
import { Navigation } from './navigation'
import { Search } from './search'
import { TProperties } from './type'
export { aboutMenus } from './constant'

const isExternal = (href: string) => href.startsWith('http')

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
  const handleLogout = () => {
    mutateLogout()
    navigate('/', { replace: true })
  }

  const { mutate: mutateLogout } = useLogout()

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 flex h-16 w-full items-center gap-4 border-b border-border/40 bg-background/95 px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/20 md:px-6',
          className,
        )}
      >
        <Navigation className="hidden shrink-0 flex-col md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6" />
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <Search />
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
              className="w-60"
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
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer gap-2"
              >
                <LogOut className="size-4 text-muted-foreground" />
                {t('navigation.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <Navigation
        variant="bottom"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 gap-1 border-t border-border/40 bg-background px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
      />
    </>
  )
}
