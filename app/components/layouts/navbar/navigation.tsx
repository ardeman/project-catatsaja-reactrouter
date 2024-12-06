import { Link, useLocation } from '@remix-run/react'

import { appleIcon, appName } from '~/lib/constants'
import { cn } from '~/lib/utils'

import { navs } from './data'
import { TProps } from './type'

export const Navigation = (props: TProps) => {
  const { className } = props
  const { pathname } = useLocation()
  return (
    <nav className={cn('gap-6 text-lg font-medium', className)}>
      <Link
        to="#"
        className="flex items-center gap-2 whitespace-nowrap text-lg font-semibold md:text-base"
      >
        <div className="relative h-6 w-6">
          <img
            src={appleIcon}
            alt={appName}
            sizes="24px"
            style={{
              objectFit: 'contain',
            }}
          />
        </div>
        <span className="sr-only">{appName}</span>
      </Link>
      {navs.map((nav, index) => (
        <Link
          key={index}
          to={nav.href}
          className={cn(
            pathname === nav.href ? 'text-foreground' : 'text-muted-foreground',
            'whitespace-nowrap transition-colors hover:text-foreground',
          )}
        >
          {nav.name}
        </Link>
      ))}
    </nav>
  )
}
