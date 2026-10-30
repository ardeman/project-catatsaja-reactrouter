import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Settings,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { useLocalStorage, useMediaQuery } from 'usehooks-ts'

import { Logo } from '~/components/base/logo'
import {
  Notifications,
  useNotifications,
} from '~/components/layouts/notifications'
import { settings } from '~/components/layouts/sidebar'
import { appName } from '~/lib/constants/metadata'
import { readStartPage } from '~/lib/constants/navigation'
import { useUserData } from '~/lib/hooks/use-get-user'
import { cn } from '~/lib/utils/shadcn'

import { AccountMenu } from './account-menu'
import { sideItemClassName, sideMenuStorageKey } from './constant'
import { Navigation } from './navigation'
import { Search } from './search'

type TSideMenuProperties = {
  notifications: ReturnType<typeof useNotifications>
  onOpenPlus: () => void
  onSignOut: () => void
}

// The desktop menu down the left edge (or the right, as chosen in
// Settings), so pages get the full height: the pages, Settings with its
// sections, and the account at the foot. Icons only on tablets, and on
// wider screens when folded.
export const SideMenu = (properties: TSideMenuProperties) => {
  const { notifications, onOpenPlus, onSignOut } = properties
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { data: userData } = useUserData()
  const isWide = useMediaQuery('(min-width: 1024px)')
  const [isFolded, setIsFolded] = useLocalStorage(sideMenuStorageKey, false)
  const isCollapsed = !isWide || isFolded
  const isSettings = pathname.split('/', 2)[1] === 'settings'
  const toggleLabel = t(
    isFolded ? 'navigation.sideMenu.expand' : 'navigation.sideMenu.collapse',
  )
  const isRight = userData?.menuSide === 'right'
  // Menus open toward the page.
  const side = isRight ? 'left' : 'right'
  const ToggleIcon = isRight
    ? isFolded
      ? PanelRightOpen
      : PanelRightClose
    : isFolded
      ? PanelLeftOpen
      : PanelLeftClose

  return (
    <aside
      className={cn(
        'sticky top-0 z-50 flex h-dvh shrink-0 flex-col gap-3 p-3 select-none',
        isCollapsed ? 'w-16 items-center' : 'w-60',
        // After the page in the layout's row.
        isRight && 'order-last',
      )}
    >
      {/* Keep blur off the ancestor so search can blur the page behind it. */}
      <div
        aria-hidden="true"
        className={cn(
          'glass-surface pointer-events-none absolute inset-0 -z-10',
          isRight ? 'border-l' : 'border-r',
        )}
      />
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          isCollapsed && 'flex-col',
        )}
      >
        <Link
          to={`/${userData?.startPage ?? readStartPage()}`}
          className={cn(
            'flex h-10 items-center gap-2 rounded-md font-semibold whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
            isCollapsed ? 'size-10 justify-center' : 'px-2',
          )}
        >
          <Logo className="size-6 object-contain" />
          <span className={cn(isCollapsed && 'sr-only')}>{appName}</span>
        </Link>
        {isWide && (
          <button
            type="button"
            aria-label={toggleLabel}
            title={toggleLabel}
            aria-pressed={isFolded}
            onClick={() => setIsFolded(!isFolded)}
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
          >
            <ToggleIcon
              aria-hidden="true"
              className="size-4"
            />
          </button>
        )}
      </div>
      <Search
        isPalette
        isCompact={isCollapsed}
      />
      <div className="-mx-3 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-1">
        <Navigation
          variant="side"
          isCollapsed={isCollapsed}
          className="grid gap-1"
          trailing={
            <div className="mt-3 grid gap-1 border-t pt-3">
              <Link
                to="/settings"
                title={isCollapsed ? t('navigation.settings') : undefined}
                // Its sections show under it, the open one marked.
                className={cn(
                  sideItemClassName(false, isCollapsed),
                  isSettings && 'text-foreground',
                )}
              >
                <Settings
                  aria-hidden="true"
                  className="size-4"
                />
                <span className={cn(isCollapsed && 'sr-only')}>
                  {t('navigation.settings')}
                </span>
              </Link>
              {isSettings && (
                <div
                  data-guide="settings-sections"
                  className={cn(
                    'grid gap-1',
                    !isCollapsed && 'ml-5 border-l pl-2',
                  )}
                >
                  {settings(t).map((setting) => {
                    const isActive = pathname === setting.href
                    const Icon = setting.icon
                    return (
                      <Link
                        key={setting.href}
                        to={setting.href}
                        title={isCollapsed ? setting.name : setting.description}
                        aria-current={isActive ? 'page' : undefined}
                        className={sideItemClassName(isActive, isCollapsed)}
                      >
                        <Icon
                          aria-hidden="true"
                          className="size-4"
                        />
                        <span className={cn(isCollapsed && 'sr-only')}>
                          {setting.name}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          }
        />
      </div>
      <div
        className={cn(
          'flex items-center gap-2 border-t pt-3',
          isCollapsed && 'flex-col-reverse',
        )}
      >
        <AccountMenu
          isCollapsed={isCollapsed}
          side={side}
          onOpenPlus={onOpenPlus}
          onSignOut={onSignOut}
        />
        <Notifications
          notifications={notifications}
          side={side}
        />
      </div>
    </aside>
  )
}
