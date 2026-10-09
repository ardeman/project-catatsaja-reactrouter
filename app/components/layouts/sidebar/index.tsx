import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { cn } from '~/lib/utils/shadcn'

import { settings } from './constant'

export const Sidebar = () => {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  return (
    <nav className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-muted p-1 text-muted-foreground md:w-full md:flex-col">
      {settings(t).map((setting) => (
        <Link
          key={setting.name}
          to={setting.href}
          className={cn(
            'inline-flex flex-1 items-center justify-center rounded-md border border-transparent px-2 py-1 font-medium whitespace-nowrap text-foreground transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 md:w-full md:justify-start md:py-2 dark:text-muted-foreground',
            pathname === setting.href
              ? 'bg-background shadow-xs dark:border-input dark:bg-card/30 dark:text-foreground'
              : '',
          )}
        >
          {setting.name}
        </Link>
      ))}
    </nav>
  )
}
