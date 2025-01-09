import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { settings } from './constant'

export const Sidebar = () => {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  return (
    <nav className="flex gap-4 text-sm text-muted-foreground md:grid">
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
