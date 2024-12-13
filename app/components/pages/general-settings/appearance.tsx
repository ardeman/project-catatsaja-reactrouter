import { useTranslation } from 'react-i18next'

import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui'
import { appName } from '~/lib/constants'

export const Appearance = () => {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.appearance.title')}</CardTitle>
        <CardDescription>
          {t('settings.appearance.description', { appName })}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
