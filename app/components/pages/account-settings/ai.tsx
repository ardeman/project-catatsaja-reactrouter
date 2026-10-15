import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/base/card'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateAiConsent } from '~/lib/hooks/use-update-ai-consent'

// AI features (receipt scanning, quick add, dictation, note helpers) send what the
// person chooses to Google's Gemini, after a one-time notice. Agreeing can
// be taken back here; the notice then shows again before the next use.
export const Ai = () => {
  const { t } = useTranslation()
  const { data: userData } = useUserData()
  const { mutate: saveConsent } = useUpdateAiConsent()
  const [isPending, setIsPending] = useState(false)
  const hasConsent = !!userData?.aiConsent

  const handleWithdraw = async () => {
    setIsPending(true)
    await saveConsent(false)
    setIsPending(false)
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{t('settings.ai.title')}</CardTitle>
        <CardDescription>{t('settings.ai.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p
          role="status"
          className="text-sm"
        >
          {t(hasConsent ? 'settings.ai.agreed' : 'settings.ai.notAgreed')}
        </p>
        {hasConsent && (
          <Button
            containerClassName="w-full sm:w-fit"
            variant="outline"
            onClick={handleWithdraw}
            isLoading={isPending}
            disabled={isPending}
          >
            {t('settings.ai.withdraw')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
