import { TFunction } from 'i18next'
import { Coins, SlidersHorizontal, UserRound } from 'lucide-react'

export const settings = (t: TFunction) => [
  {
    name: t('navigation.general'),
    description: t('settings.sections.general'),
    href: '/settings',
    icon: SlidersHorizontal,
  },
  {
    name: t('navigation.account'),
    description: t('settings.sections.account'),
    href: '/settings/account',
    icon: UserRound,
  },
  {
    name: t('navigation.currency'),
    description: t('settings.sections.currency'),
    href: '/settings/currency',
    icon: Coins,
  },
]
