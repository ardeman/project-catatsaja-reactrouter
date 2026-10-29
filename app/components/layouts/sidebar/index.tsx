import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { cn } from '~/lib/utils/shadcn'

import { settings } from './constant'
export { settings } from './constant'

// Tabs on phones (icon above a short label, so four fit). From md up the
// sections are under Settings in the side menu (`layouts/navbar`).
export const Sidebar = () => {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  return (
    <nav
      aria-label={t('navigation.settings')}
      className="glass-surface sticky top-[calc(1rem+var(--top-inset))] z-30 grid grid-cols-4 gap-1 rounded-lg border p-1 select-none md:hidden"
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
              'flex min-w-0 flex-col items-center justify-center gap-1 rounded-md border border-transparent px-1 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden',
              isActive &&
                'bg-background text-foreground shadow-xs dark:border-input dark:bg-card/30',
            )}
          >
            <Icon
              className={cn('size-4 shrink-0', isActive && 'text-primary')}
            />
            <span className="max-w-full truncate">{setting.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
