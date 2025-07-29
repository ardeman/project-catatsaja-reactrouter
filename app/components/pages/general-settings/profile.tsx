import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { Input } from '~/components/base/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateProfile } from '~/lib/hooks/use-update-profile'
import { TUpdateProfileRequest } from '~/lib/types/settings'
import { generalSettingSchema } from '~/lib/validations/settings'

export const Profile = () => {
  const { t } = useTranslation()
  const [disabled, setDisabled] = useState(false)
  const { data: userData } = useUserData()
  const formMethods = useForm<TUpdateProfileRequest>({
    resolver: zodResolver(generalSettingSchema(t)),
    values: {
      displayName: userData?.displayName || '',
    },
  })
  const { handleSubmit, formState } = formMethods
  const onSubmit = handleSubmit(async (data) => {
    setDisabled(true)
    mutateUpdateProfile(data)
  })

  const {
    mutate: mutateUpdateProfile,
    isPending: isUpdateProfilePending,
    isSuccess: isUpdateProfileSuccess,
    isError: isUpdateProfileError,
  } = useUpdateProfile()

  useEffect(() => {
    if (isUpdateProfileError || isUpdateProfileSuccess) {
      setDisabled(false)
    }
  }, [isUpdateProfileSuccess, isUpdateProfileError])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.profile.title')}</CardTitle>
        <CardDescription>{t('settings.profile.description')}</CardDescription>
      </CardHeader>
      <FormProvider {...formMethods}>
        <form onSubmit={onSubmit}>
          <CardContent>
            <Input
              label={t('auth.form.displayName.label')}
              name="displayName"
              disabled={disabled}
              placeholder={t('auth.form.displayName.placeholder')}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button
              disabled={
                isUpdateProfilePending || disabled || !formState.isDirty
              }
              isLoading={isUpdateProfilePending}
              type="submit"
            >
              {t('form.save')}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  )
}
