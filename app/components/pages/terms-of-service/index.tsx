import { useTranslation } from 'react-i18next'

export const TermsOfServicePage = () => {
  const { t } = useTranslation()
  return (
    <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-8">
      <h1 className="text-3xl font-semibold">
        {t('navigation.termsOfService')}
      </h1>
      <p>{t('termsOfService.description')}</p>
    </main>
  )
}
