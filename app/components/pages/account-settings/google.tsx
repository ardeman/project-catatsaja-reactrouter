import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FcGoogle } from 'react-icons/fc'

import { Button } from '~/components/base'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui'
import { appName } from '~/lib/constants'
import { useAuthUser, useLinkGoogle } from '~/lib/hooks'

import { TProps } from './type'

export const Google = (props: TProps) => {
  const { disabled, setDisabled } = props
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
          {t('settings.google.description', { appName })}
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
          {userGoogleProvider
            ? t('settings.google.button.linked', {
                email: userGoogleProvider.email,
              })
            : t('settings.google.button.link')}
        </Button>
      </CardContent>
    </Card>
  )
}
