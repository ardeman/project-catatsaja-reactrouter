import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { appleIcon, appName } from '~/lib/constants/metadata'
import { cn } from '~/lib/utils/shadcn'

import { navs } from './constant'
import { TProperties } from './type'

export const Navigation = (properties: TProperties) => {
  const { className, variant = 'bar' } = properties
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const isBottom = variant === 'bottom'

  return (
    <nav
      aria-label={t('navigation.menu')}
      data-variant={variant}
      className={cn('gap-6 text-lg font-medium', className)}
    >
      {!isBottom && (
        <Link
          to="/notes"
          className="flex shrink-0 items-center gap-2 text-lg font-semibold whitespace-nowrap md:text-base"
        >
          <img
            src={appleIcon}
            alt=""
            className="size-6 object-contain"
          />
          <span className="sr-only">{appName}</span>
        </Link>
      )}
      {navs(t).map((nav) => {
        const isActive = pathname.split('/')[1] === nav.href.split('/')[1]
        const Icon = nav.icon
        return (
          <Link
            key={nav.href}
            to={nav.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap transition-colors hover:text-foreground',
              isActive ? 'text-primary' : 'text-muted-foreground',
              isBottom &&
                'h-14 min-w-0 flex-col justify-center gap-0.5 rounded-full px-1 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
              isBottom && isActive && 'bg-primary/15 text-foreground',
            )}
          >
            {Icon && (
              <Icon
                aria-hidden="true"
                className={cn('size-4', isBottom && 'size-5')}
              />
            )}
            {nav.name}
          </Link>
        )
      })}
    </nav>
  )
}
