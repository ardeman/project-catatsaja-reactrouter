import { TFunction } from 'i18next'

export const settings = (t: TFunction) => [
  {
    name: t('navigation.general'),
    href: '/dashboard/settings',
  },
  {
    name: t('navigation.account'),
    href: '/dashboard/settings/account',
  },
]
