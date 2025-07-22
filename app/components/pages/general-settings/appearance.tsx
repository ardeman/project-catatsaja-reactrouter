import { useEffect } from 'react'
import { FormProvider, useForm, Controller } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { LanguageSelector } from '~/components/base/language-selector'
import { ModeToggle } from '~/components/base/mode-toggle'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { appName } from '~/lib/constants/metadata'
import { useTheme } from '~/lib/contexts/theme'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateAppearance } from '~/lib/hooks/use-update-appearance'
import { TUpdateAppearanceRequest } from '~/lib/types/settings'
import { supportedLanguages } from '~/localization/resource'

export const Appearance = () => {
  const { t, i18n } = useTranslation()
  const { theme } = useTheme()
  const { mutate, isPending } = useUpdateAppearance()
  const { data: userData } = useUserData()

  const formMethods = useForm<TUpdateAppearanceRequest>({
    values: {
      theme: userData?.theme ?? theme,
      language: userData?.language ?? supportedLanguages[0],
    },
  })
  const { handleSubmit, watch, formState } = formMethods

  const watchTheme = watch('theme')
  const watchLanguage = watch('language')

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    const value = watchTheme
    if (value === 'system') {
      const systemTheme = globalThis.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(value)
    }
  }, [watchTheme])

  useEffect(() => {
    if (watchLanguage && i18n.language !== watchLanguage)
      i18n.changeLanguage(watchLanguage)
  }, [watchLanguage, i18n])

  const onSubmit = handleSubmit(async (data) => {
    await mutate(data)
  })

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
      <FormProvider {...formMethods}>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-6">
            <Controller
              control={formMethods.control}
              name="language"
              render={({ field }) => (
                <LanguageSelector
                  type="radio"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={formMethods.control}
              name="theme"
              render={({ field }) => (
                <ModeToggle
                  type="radio"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button
              className="w-fit"
              isLoading={isPending}
              disabled={isPending || !formState.isDirty}
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
