import i18next from 'i18next'
import { useEffect } from 'react'
import { FormProvider, useForm, Controller } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { LanguageSelector } from '~/components/base/language-selector'
import { ModeToggle } from '~/components/base/mode-toggle'
import { SizeToggle } from '~/components/base/size-toggle'
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
  const { t } = useTranslation()
  const { theme, size, setTheme, setSize, previewTheme, previewSize } =
    useTheme()
  const { mutate, isPending } = useUpdateAppearance()
  const { data: userData } = useUserData()

  const formMethods = useForm<TUpdateAppearanceRequest>({
    values: {
      theme: userData?.theme ?? theme,
      language: userData?.language ?? supportedLanguages[0],
      size: userData?.size ?? size,
    },
  })
  const { handleSubmit, watch, formState } = formMethods

  const watchTheme = watch('theme')
  const watchLanguage = watch('language')
  const watchSize = watch('size')

  // Preview the choice (page and status bar) before it is saved; leaving
  // the page without saving goes back to the saved theme and size.
  useEffect(() => {
    previewTheme(watchTheme)
  }, [watchTheme, previewTheme])

  useEffect(() => {
    previewSize(watchSize)
  }, [watchSize, previewSize])

  useEffect(
    () => () => {
      previewTheme()
      previewSize()
    },
    [previewTheme, previewSize],
  )

  // Preview the language too; leaving without saving goes back to the saved
  // one (or the one in use when the page opened).
  useEffect(() => {
    if (watchLanguage && i18next.language !== watchLanguage)
      void i18next.changeLanguage(watchLanguage)
  }, [watchLanguage])

  const savedLanguage = userData?.language
  useEffect(() => {
    const languageOnOpen = i18next.language
    return () => {
      const target = savedLanguage ?? languageOnOpen
      if (i18next.language !== target) void i18next.changeLanguage(target)
    }
  }, [savedLanguage])

  const onSubmit = handleSubmit(async (data) => {
    const isSaved = await mutate(data)
    // Apply right away instead of waiting for the profile to reload.
    if (isSaved) {
      setTheme(data.theme)
      setSize(data.size)
    }
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
            <Controller
              control={formMethods.control}
              name="size"
              render={({ field }) => (
                <SizeToggle
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
