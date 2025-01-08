import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { FcGoogle } from 'react-icons/fc'

import { Button } from '~/components/base/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { appName } from '~/lib/constants/metadata'
import { useAuthUser } from '~/lib/hooks/use-auth-user'
import { useLinkGoogle } from '~/lib/hooks/use-link-google'

import { TProperties } from './type'

export const Google = (properties: TProperties) => {
  const { disabled, setDisabled } = properties
  const { t } = useTranslation()
  const { data: authData } = useAuthUser()
  const userGoogleProvider = authData?.providerData.find(
    (provider) => provider.providerId === 'google.com',
  )

  const {
    mutate: mutateLinkGoogle,
    isPending: isLinkGooglePending,
    isSuccess: isLinkGoogleSuccess,
    isError: isLinkGoogleError,
  } = useLinkGoogle()

  useEffect(() => {
    if (isLinkGoogleSuccess || isLinkGoogleError) {
      setDisabled(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLinkGoogleSuccess, isLinkGoogleError])

  const handleLinkGoogle = () => {
    mutateLinkGoogle()
    setDisabled(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-1">
          {t('settings.google.title')}
        </CardTitle>
        <CardDescription>
          <Trans
            i18nKey="settings.google.description"
            values={{ appName }}
            components={{ span: <span className="text-primary" /> }}
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          containerClassName="w-full sm:w-fit"
          variant="outline"
          onClick={handleLinkGoogle}
          disabled={disabled || !!userGoogleProvider}
          isLoading={isLinkGooglePending}
        >
          <FcGoogle className="text-xl" />
          {userGoogleProvider ? (
            <Trans
              i18nKey="settings.google.button.linked"
              values={{ email: userGoogleProvider.email }}
              components={{ strong: <strong className="text-primary" /> }}
            />
          ) : (
            t('settings.google.button.link')
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
