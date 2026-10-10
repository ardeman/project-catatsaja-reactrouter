import { TFunction } from 'i18next'
import { Bug, ListTodo, Settings, StickyNote, Wallet } from 'lucide-react'

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

export const navs = (t: TFunction): TMenu[] => [
  {
    name: t('navigation.notes'),
    href: '/notes',
    icon: StickyNote,
  },
  {
    name: t('navigation.tasks'),
    href: '/tasks',
    icon: ListTodo,
  },
  {
    name: t('navigation.finances'),
    href: '/finances',
    icon: Wallet,
  },
]
