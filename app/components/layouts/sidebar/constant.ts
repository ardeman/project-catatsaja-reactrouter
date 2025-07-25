import { TFunction } from 'i18next'

export const settings = (t: TFunction) => [
  {
    name: t('navigation.general'),
    href: '/settings',
  },
  {
    name: t('navigation.account'),
    href: '/settings/account',
  },
  {
    name: t('navigation.currency'),
    href: '/settings/currency',
  },
]
