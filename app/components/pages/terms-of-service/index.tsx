import { Trans, useTranslation } from 'react-i18next'

import { appName } from '~/lib/constants/metadata'

export const TermsOfServicePage = () => {
  const { t } = useTranslation()
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-semibold">
        {t('navigation.termsOfService')}
      </h1>
      <p>
        <Trans
          i18nKey="termsOfService.paragraph1"
          values={{ appName }}
          components={{ span: <span className="text-primary" /> }}
        />
      </p>
      <p>
        <Trans
          i18nKey="termsOfService.paragraph2"
          values={{ appName }}
          components={{ span: <span className="text-primary" /> }}
        />
      </p>
      <p>
        <Trans
          i18nKey="termsOfService.paragraph3"
          values={{ appName }}
          components={{ span: <span className="text-primary" /> }}
        />
      </p>
    </div>
  )
}
