import { useTranslation } from 'react-i18next'

export const PrivacyPolicyPage = () => {
  const { t } = useTranslation()
  return (
    <div className="mx-auto grid min-h-fit max-w-md gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-3xl font-semibold">
        {t('navigation.privacyPolicy')}
      </h1>
      <p>{t('privacyPolicy.description')}</p>
    </div>
  )
}
