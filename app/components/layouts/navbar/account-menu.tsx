import {
  CircleUser,
  ExternalLink,
  Lock,
  LogOut,
  CircleQuestionMark,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { InstallApp } from '~/components/base/install-app'
import { PlanBadge } from '~/components/base/plan-badge'
import { useStartScreenGuide } from '~/components/base/screen-guide'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
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
import { TMenu } from '~/lib/types/common'
import { lockSession } from '~/lib/utils/encryption-session'
import { cn } from '~/lib/utils/shadcn'

import { aboutMenus, isExternal, userMenus } from './constant'

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

type TAccountMenuProperties = {
  isCollapsed: boolean
  // Toward the page, away from the screen's edge.
  side: 'left' | 'right'
  onOpenPlus: () => void
  onSignOut: () => void
}

// The account at the foot of the desktop side menu: photo and name (the
// photo alone when folded), opening the account menu beside it.
export const AccountMenu = (properties: TAccountMenuProperties) => {
  const { isCollapsed, side, onOpenPlus, onSignOut } = properties
  const { t } = useTranslation()
  const { data: userData } = useUserData()
  const encryption = useEncryptionSession()
  const guide = useStartScreenGuide()
  const label = t('navigation.userMenu')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        data-guide="account"
        title={label}
        className={cn(
          'flex w-full min-w-0 items-center gap-3 rounded-md p-1 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden data-[state=open]:bg-accent',
          isCollapsed && 'size-10 justify-center p-0',
        )}
      >
        <Avatar className="size-8 shrink-0">
          <AvatarImage src={userData?.photoURL || ''} />
          <AvatarFallback>
            <CircleUser className="size-5" />
          </AvatarFallback>
        </Avatar>
        {!isCollapsed && (
          <span className="grid min-w-0 text-sm">
            <span className="truncate font-medium">
              {userData?.displayName || userData?.email}
            </span>
            {userData?.displayName && (
              <span className="truncate text-xs text-muted-foreground">
                {userData.email}
              </span>
            )}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align="end"
        sideOffset={12}
        collisionPadding={16}
        className="glass-surface w-60"
      >
        <DropdownMenuLabel className="grid font-normal">
          {userData?.displayName && (
            <span className="truncate font-medium">{userData.displayName}</span>
          )}
          <span className="truncate text-xs text-muted-foreground">
            {userData?.email}
          </span>
          <DropdownMenuItem
            title={t('plus.info.open')}
            className="mt-1.5 w-fit cursor-pointer rounded-full p-0"
            onSelect={onOpenPlus}
          >
            <PlanBadge />
          </DropdownMenuItem>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userMenus(t)
          // Settings has its own place in the side menu.
          .filter((menu) => menu.href !== '/settings')
          .map((menu) => (
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
        {aboutMenus(t).map((menu) =>
          // Signed in, the page's own guide takes How to use's place.
          menu.href === '/help' && guide.canStart ? (
            <DropdownMenuItem
              key={menu.href}
              onSelect={guide.start}
              className="cursor-pointer gap-2"
            >
              {t('guide.start')}
              <CircleQuestionMark className="ml-auto size-3.5 text-muted-foreground" />
            </DropdownMenuItem>
          ) : (
            <MenuLink
              key={menu.href}
              menu={menu}
            />
          ),
        )}
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
          onClick={onSignOut}
          className="cursor-pointer gap-2"
        >
          <LogOut className="size-4 text-muted-foreground" />
          {t('navigation.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
