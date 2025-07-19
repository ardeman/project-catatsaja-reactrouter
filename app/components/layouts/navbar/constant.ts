import { TFunction } from 'i18next'

import { githubRepo, githubUser } from '~/lib/constants/metadata'
import { TMenu } from '~/lib/types/common'

export const userMenus = (t: TFunction): TMenu[] => [
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

export const aboutMenus = (t: TFunction): TMenu[] => [
  {
    name: t('navigation.about'),
    href: '/about',
  },
  {
    name: t('navigation.privacyPolicy'),
    href: '/privacy-policy',
  },
  {
    name: t('navigation.termsOfService'),
    href: '/terms-of-service',
  },
]

export const navs = (t: TFunction): TMenu[] => [
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
