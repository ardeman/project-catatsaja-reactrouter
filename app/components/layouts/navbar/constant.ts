import { TFunction } from 'i18next'

import { githubRepo, githubUser } from '~/lib/constants/metadata'

export const userMenus = (t: TFunction) => [
  {
    name: t('navigation.settings'),
    href: '/dashboard/settings',
  },
  {
    name: t('navigation.reportIssues'),
    href: `https://github.com/${githubUser}/${githubRepo}/issues`,
  },
  {
    name: t('navigation.changelog'),
    href: `https://github.com/${githubUser}/${githubRepo}/commits/main/`,
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
