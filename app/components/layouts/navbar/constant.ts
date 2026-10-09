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
]

export const aboutMenus = (t: TFunction): TMenu[] => [
  {
    name: t('navigation.about'),
    href: '/about',
  },
  {
    name: t('navigation.changelog'),
    href: '/changelog',
  },
  {
    name: t('navigation.privacyPolicy'),
    href: '/privacy',
  },
  {
    name: t('navigation.termsOfService'),
    href: '/terms',
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
    name: t('navigation.finances'),
    href: '/finances',
  },
]
