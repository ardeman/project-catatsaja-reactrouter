import { TFunction } from 'i18next'
import { Bug, Settings } from 'lucide-react'

import { githubRepo, githubUser } from '~/lib/constants/metadata'
import { TMenu } from '~/lib/types/common'

export const userMenus = (t: TFunction): TMenu[] => [
  {
    name: t('navigation.settings'),
    href: '/settings',
    icon: Settings,
  },
  {
    name: t('navigation.reportIssues'),
    href: `https://github.com/${githubUser}/${githubRepo}/issues`,
    icon: Bug,
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
