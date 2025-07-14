import { useEffect, useRef, useState } from 'react'
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
import { Theme, useTheme } from '~/lib/contexts/theme'
import { useUpdateAppearance } from '~/lib/hooks/use-update-appearance'

export const Appearance = () => {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { mutate, isPending } = useUpdateAppearance()

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language)
  const [selectedTheme, setSelectedTheme] = useState<Theme>(theme)

  const initialLanguage = useRef(i18n.language)
  const initialTheme = useRef(theme)
  const isSaved = useRef(false)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    const value = selectedTheme
    if (value === 'system') {
      const systemTheme = globalThis.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(value)
    }
  }, [selectedTheme])

  useEffect(() => {
    i18n.changeLanguage(selectedLanguage)
  }, [selectedLanguage, i18n])

  useEffect(() => {
    return () => {
      if (!isSaved.current) {
        setTheme(initialTheme.current)
        i18n.changeLanguage(initialLanguage.current)
      }
    }
  }, [setTheme, i18n])

  const handleSave = async () => {
    await mutate({ theme: selectedTheme, language: selectedLanguage })
    setTheme(selectedTheme)
    isSaved.current = true
  }

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
      <CardContent className="space-y-6">
        <LanguageSelector
          type="radio"
          value={selectedLanguage}
          onChange={(lng) => setSelectedLanguage(lng)}
        />
        <ModeToggle
          type="radio"
          value={selectedTheme}
          onChange={(value) => setSelectedTheme(value)}
        />
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button
          className="w-fit"
          isLoading={isPending}
          disabled={
            isPending ||
            (selectedLanguage === initialLanguage.current &&
              selectedTheme === initialTheme.current)
          }
          onClick={handleSave}
        >
          {t('form.save')}
        </Button>
      </CardFooter>
    </Card>
  )
}
