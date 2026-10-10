import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { cn } from '~/lib/utils/shadcn'

import { settings } from './constant'

// Tabs on phones; a list with a line about each section from md up.
export const Sidebar = () => {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  return (
    <nav
      aria-label={t('navigation.settings')}
      className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 md:sticky md:top-24 md:grid-cols-1"
    >
      {settings(t).map((setting) => {
        const isActive = pathname === setting.href
        const Icon = setting.icon
        return (
          <Link
            key={setting.href}
            to={setting.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex min-w-0 items-center justify-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden md:items-start md:justify-start md:gap-3 md:px-3 md:py-2.5',
              isActive &&
                'bg-background text-foreground shadow-xs dark:border-input dark:bg-card/30',
            )}
          >
            <Icon
              className={cn(
                'size-4 shrink-0 md:mt-0.5',
                isActive && 'text-primary',
              )}
            />
            <span className="grid min-w-0">
              <span className="truncate">{setting.name}</span>
              <span className="hidden text-xs font-normal text-muted-foreground md:block">
                {setting.description}
              </span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
