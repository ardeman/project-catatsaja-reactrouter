import { Trans, useTranslation } from 'react-i18next'

import { contactEmail } from '~/lib/constants/metadata'

const paragraphs = ['collect', 'use', 'storage', 'sharing', 'analytics']

export const PrivacyPolicyPage = () => {
  const { t } = useTranslation()
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-3xl font-semibold">
          {t('navigation.privacyPolicy')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('privacyPolicy.updated')}
        </p>
      </div>
      {paragraphs.map((key) => (
        <p key={key}>{t(`privacyPolicy.${key}`)}</p>
      ))}
      <p>
        <Trans
          i18nKey="privacyPolicy.contact"
          values={{ email: contactEmail }}
          components={{
            a: (
              <a
                href={`mailto:${contactEmail}`}
                className="text-primary underline underline-offset-4"
              >
                {contactEmail}
              </a>
            ),
          }}
        />
      </p>
    </div>
  )
}
