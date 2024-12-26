import { TFunction } from 'i18next'

export const userMenus = (t: TFunction) => [
  {
    name: t('navigation.settings'),
    href: '/dashboard/settings',
  },
  {
    name: t('navigation.reportIssues'),
    href: 'https://github.com/ardeman/project-remix-catatsaja/issues',
  },
]

export const navs = (t: TFunction) => [
  {
    name: t('navigation.dashboard'),
    href: '/dashboard',
  },
  {
    name: t('navigation.notes'),
    href: '/dashboard/notes',
  },
  {
    name: t('navigation.tasks'),
    href: '/dashboard/tasks',
  },
  {
    name: t('navigation.moneyLog'),
    href: '/dashboard/money-log',
  },
]

export const reloadNavs = ['/dashboard/notes']
