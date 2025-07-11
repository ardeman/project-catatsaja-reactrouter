import { TFunction } from 'i18next'

import { githubRepo, githubUser } from '~/lib/constants/metadata'

export const userMenus = (t: TFunction) => [
  {
    name: t('navigation.settings'),
    href: '/settings',
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
    name: t('navigation.notes'),
    href: '/notes',
  },
  {
    name: t('navigation.tasks'),
    href: '/tasks',
  },
  {
    name: t('navigation.moneyLog'),
    href: '/money-log',
  },
]
