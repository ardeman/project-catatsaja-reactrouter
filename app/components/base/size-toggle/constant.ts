import { TFunction } from 'i18next'

export const sizeOptions = (t: TFunction) => [
  {
    value: 'small',
    label: t('settings.appearance.form.size.small'),
  },
  {
    value: 'medium',
    label: t('settings.appearance.form.size.medium'),
  },
  {
    value: 'large',
    label: t('settings.appearance.form.size.large'),
  },
]
