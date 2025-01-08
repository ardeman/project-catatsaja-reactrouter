import { Trans, useTranslation } from 'react-i18next'

import { LanguageSelector } from '~/components/base/language-selector'
import { ModeToggle } from '~/components/base/mode-toggle'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { appName } from '~/lib/constants/metadata'

export const Appearance = () => {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.appearance.title')}</CardTitle>
        <CardDescription>
          <Trans
            i18nKey="settings.appearance.description"
            values={{ appName }}
            components={{ span: <span className="text-primary" /> }}
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid space-y-6">
          <LanguageSelector type="radio" />
          <ModeToggle type="radio" />
        </div>
      </CardContent>
    </Card>
  )
}
