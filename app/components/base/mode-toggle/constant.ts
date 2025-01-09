import { TFunction } from 'i18next'

export const themeOptions = (t: TFunction) => [
  {
    value: 'light',
    label: t('settings.appearance.form.theme.light'),
  },
  {
    value: 'dark',
    label: t('settings.appearance.form.theme.dark'),
  },
  {
    value: 'system',
    label: t('settings.appearance.form.theme.system'),
  },
]
