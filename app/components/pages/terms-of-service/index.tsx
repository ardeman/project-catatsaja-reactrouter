import { useTranslation } from 'react-i18next'

export const TermsOfServicePage = () => {
  const { t } = useTranslation()
  return (
    <div className="mx-auto grid min-h-fit max-w-md gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-3xl font-semibold">
        {t('navigation.termsOfService')}
      </h1>
      <p>{t('termsOfService.description')}</p>
    </div>
  )
}
