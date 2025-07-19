import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { homeMenus } from './constant'

export const AboutFooter = () => {
  const { t } = useTranslation(['common', 'zod'])

  return (
    <div className="mt-2 flex w-full items-center justify-center text-center text-xs text-muted-foreground">
      {homeMenus(t).map((menu, index) => (
        <div
          key={index}
          className="flex items-center"
        >
          <Link
            to={menu.href}
            className="hover:underline"
          >
            {menu.name}
          </Link>
          {index < homeMenus(t).length - 1 && (
            <span className="pointer-events-none select-none px-1 sm:px-2">
              ·
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
