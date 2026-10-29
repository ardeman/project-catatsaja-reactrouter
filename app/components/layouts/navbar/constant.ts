import { TFunction } from 'i18next'
import { Bug, Settings } from 'lucide-react'

import { githubRepository, githubUser } from '~/lib/constants/metadata'
import { TMenu } from '~/lib/types/common'
import { cn } from '~/lib/utils/shadcn'

export const isExternal = (href: string) => href.startsWith('http')

// Whether the desktop side menu is folded to icons, kept per browser.
export const sideMenuStorageKey = 'side-menu-collapsed'

// A link in the desktop side menu: icon and name, or the icon alone when
// the menu is folded.
export const sideItemClassName = (isActive: boolean, isCollapsed: boolean) =>
  cn(
    'relative flex h-9 items-center gap-3 rounded-md border border-transparent px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
    isCollapsed && 'size-10 justify-center px-0',
    isActive &&
      'bg-background text-foreground shadow-xs hover:bg-background dark:border-input dark:bg-card/30 [&_svg]:text-primary',
  )

export const userMenus = (t: TFunction): TMenu[] => [
  {
    name: t('navigation.settings'),
    href: '/settings',
    icon: Settings,
  },
  {
    name: t('navigation.reportIssues'),
    href: `https://github.com/${githubUser}/${githubRepository}/issues`,
    icon: Bug,
  },
]

export const aboutMenus = (t: TFunction): TMenu[] => [
  {
    name: t('navigation.about'),
    href: '/about',
  },
  {
    name: t('navigation.help'),
    href: '/help',
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
