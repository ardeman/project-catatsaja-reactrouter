import { Trans, useTranslation } from 'react-i18next'

import { appName } from '~/lib/constants/metadata'

export const AboutPage = () => {
  const { t } = useTranslation()
  return (
    <div className="mx-auto grid min-h-fit max-w-md gap-4 p-4 md:gap-8 md:p-8 md:pt-0">
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
