import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { cn } from '~/lib/utils/shadcn'

import { settings } from './constant'

// Tabs on phones (icon above a short label, so four fit); a list with a
// line about each section from md up.
export const Sidebar = () => {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  return (
    <nav
      aria-label={t('navigation.settings')}
      className="glass-surface sticky top-20 z-30 grid grid-cols-4 gap-1 rounded-lg border p-1 md:top-24 md:grid-cols-1"
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
              'flex min-w-0 flex-col items-center justify-center gap-1 rounded-md border border-transparent px-1 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden md:flex-row md:items-start md:justify-start md:gap-3 md:px-3 md:py-2.5 md:text-sm',
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
            <span className="grid min-w-0 text-center md:text-left">
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
