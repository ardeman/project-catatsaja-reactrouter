import { useTranslation } from 'react-i18next'

export const PrivacyPolicyPage = () => {
  const { t } = useTranslation()
  return (
    <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-8">
      <h1 className="text-3xl font-semibold">
        {t('navigation.privacyPolicy')}
      </h1>
      <p>
        We respect your privacy and do not share your personal information with
        third parties except as required to provide our services.
      </p>
    </main>
  )
}
