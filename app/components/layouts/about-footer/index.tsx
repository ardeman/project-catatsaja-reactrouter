import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { appName } from '~/lib/constants/metadata'
import { cn } from '~/lib/utils/shadcn'

import { homeMenus } from './constant'

export const AboutFooter = () => {
  const { t } = useTranslation(['common', 'zod'])
  const { pathname } = useLocation()

  return (
    <footer className="flex w-full flex-wrap items-center justify-center gap-y-1 px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground md:px-6">
      {homeMenus(t).map((menu, index) => (
        <div
          key={index}
          className="flex items-center"
        >
          <Link
            to={menu.href}
            className={cn(
              'whitespace-nowrap hover:underline',
              menu.name === appName ? 'text-primary' : '',
              menu.href === pathname ? 'text-foreground' : '',
            )}
          >
            {menu.name}
          </Link>
          {index < homeMenus(t).length - 1 && (
            <span className="pointer-events-none px-1 select-none sm:px-2">
              ·
            </span>
          )}
        </div>
      ))}
    </footer>
  )
}
