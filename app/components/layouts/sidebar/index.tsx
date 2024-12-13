import { Link, useLocation } from '@remix-run/react'
import { useTranslation } from 'react-i18next'

import { settings } from './data'

export const Sidebar = () => {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  return (
    <nav className="grid gap-4 text-sm text-muted-foreground">
      {settings(t).map((setting) => (
        <Link
          key={setting.name}
          to={setting.href}
          className={
            pathname === setting.href ? 'font-semibold text-primary' : ''
          }
        >
          {setting.name}
        </Link>
      ))}
    </nav>
  )
}
