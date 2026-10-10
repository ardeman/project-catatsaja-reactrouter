import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { appleIcon, appName } from '~/lib/constants/metadata'
import { cn } from '~/lib/utils/shadcn'

import { navs } from './constant'
import { TProperties } from './type'

export const Navigation = (properties: TProperties) => {
  const { className, onLinkClick, variant = 'bar' } = properties
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const isMenu = variant === 'menu'

  return (
    <nav className={cn('gap-6 text-lg font-medium', className)}>
      {!isMenu && (
        <Link
          to="/notes"
          onClick={onLinkClick}
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
            onClick={onLinkClick}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap transition-colors hover:text-foreground',
              isActive ? 'text-primary' : 'text-muted-foreground',
              isMenu && 'rounded-lg px-3 py-2.5 text-base hover:bg-accent',
              isMenu && isActive && 'bg-accent',
            )}
          >
            {Icon && <Icon className={cn('size-4', isMenu && 'size-5')} />}
            {nav.name}
          </Link>
        )
      })}
    </nav>
  )
}
