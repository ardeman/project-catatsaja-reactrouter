import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export const AuthFooter = () => {
  const { t } = useTranslation(['common', 'zod'])

  return (
    <div className="absolute mt-2 w-full space-x-2 text-center text-xs text-muted-foreground">
      <Link
        to="/about"
        className="hover:underline"
      >
        {t('navigation.about')}
      </Link>
      <span>&middot;</span>
      <Link
        to="/privacy-policy"
        className="hover:underline"
      >
        {t('navigation.privacyPolicy')}
      </Link>
      <span>&middot;</span>
      <Link
        to="/terms-of-service"
        className="hover:underline"
      >
        {t('navigation.termsOfService')}
      </Link>
    </div>
  )
}
