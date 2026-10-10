import i18next from 'i18next'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { ChoiceCards } from '~/components/base/choice-cards'
import { SaveStatus, TSaveStatus } from '~/components/base/save-status'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { appName } from '~/lib/constants/metadata'
import { Size, Theme, useTheme } from '~/lib/contexts/theme'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateAppearance } from '~/lib/hooks/use-update-appearance'
import { TUpdateAppearanceRequest } from '~/lib/types/settings'
import { languageOptions } from '~/localization/i18n'
import { supportedLanguages } from '~/localization/resource'

const themeIcons = { light: Sun, dark: Moon, system: Monitor }
const sizeSamples = { small: 'text-sm', medium: 'text-base', large: 'text-xl' }

// Each choice applies and saves right away; there is nothing to submit.
export const Appearance = () => {
  const { t } = useTranslation()
  const { theme, size, setTheme, setSize } = useTheme()
  const { mutate } = useUpdateAppearance()
  const { data: userData } = useUserData()
  const [status, setStatus] = useState<TSaveStatus>('idle')

  const [choice, setChoice] = useState<TUpdateAppearanceRequest>(() => ({
    theme: userData?.theme ?? theme,
    size: userData?.size ?? size,
    language:
      userData?.language ?? i18next.resolvedLanguage ?? supportedLanguages[0],
  }))
  // The latest choice, so quick changes in a row each save all three.
  const latest = useRef(choice)

  useEffect(() => {
    if (!userData) return
    const next = {
      theme: userData.theme ?? latest.current.theme,
      size: userData.size ?? latest.current.size,
      language: userData.language ?? latest.current.language,
    }
    latest.current = next
    setChoice(next)
  }, [userData])

  const handleChange = async (change: Partial<TUpdateAppearanceRequest>) => {
    const next = { ...latest.current, ...change }
    latest.current = next
    setChoice(next)
    if (change.theme !== undefined) setTheme(change.theme)
    if (change.size !== undefined) setSize(change.size)
    if (change.language && i18next.language !== change.language)
      void i18next.changeLanguage(change.language)
    setStatus('saving')
    const isSaved = await mutate(next)
    setStatus(isSaved ? 'saved' : 'error')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          {t('settings.appearance.title')}
          <span className="text-xs font-normal text-muted-foreground">
            <SaveStatus status={status} />
          </span>
        </CardTitle>
        <CardDescription>
          <Trans
            i18nKey="settings.appearance.description"
            values={{ appName }}
            components={{ span: <span className="text-primary" /> }}
          />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChoiceCards<Theme>
          label={t('settings.appearance.form.theme.selector')}
          value={choice.theme}
          onChange={(value) => void handleChange({ theme: value })}
          className="grid-cols-3"
          options={(['light', 'dark', 'system'] as const).map((value) => {
            const Icon = themeIcons[value]
            return {
              value,
              label: t(`settings.appearance.form.theme.${value}`),
              visual: <Icon className="size-5" />,
            }
          })}
        />
        <ChoiceCards<Size>
          label={t('settings.appearance.form.size.selector')}
          value={choice.size}
          onChange={(value) => void handleChange({ size: value })}
          className="grid-cols-3"
          options={(['small', 'medium', 'large'] as const).map((value) => ({
            value,
            label: t(`settings.appearance.form.size.${value}`),
            visual: (
              <span
                aria-hidden
                className={`flex h-7 items-end leading-none font-semibold ${sizeSamples[value]}`}
              >
                Aa
              </span>
            ),
          }))}
        />
        <ChoiceCards
          label={t('settings.appearance.form.language.selector')}
          value={choice.language}
          onChange={(value) => void handleChange({ language: value })}
          className="grid-cols-2"
          options={languageOptions.map((option) => ({
            value: option.value,
            label: option.label,
            visual: (
              <span
                aria-hidden
                className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold tracking-wide uppercase"
              >
                {option.value}
              </span>
            ),
          }))}
        />
      </CardContent>
    </Card>
  )
}
