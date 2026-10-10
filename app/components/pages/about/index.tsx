import { Trans, useTranslation } from 'react-i18next'

import { appName } from '~/lib/constants/metadata'

export const AboutPage = () => {
  const { t } = useTranslation()
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-semibold">{t('navigation.about')}</h1>
      <p>
        <Trans
          i18nKey="about.description"
          values={{ appName }}
          components={{ span: <span className="text-primary" /> }}
        />
      </p>
    </div>
  )
}
