import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/base/card'
import { ChoiceCards } from '~/components/base/choice-cards'
import { SaveStatus, TSaveStatus } from '~/components/base/save-status'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateHealthSettings } from '~/lib/hooks/use-update-health-settings'
import { TBmiStandard, TLabUnits } from '~/lib/types/health'
import { TUpdateHealthSettingsRequest } from '~/lib/types/settings'

// How health values are judged (adult BMI categories) and shown (units).
// Each change applies and saves right away.
export const Health = () => {
  const { t } = useTranslation()
  const { data: userData } = useUserData()
  const { mutate } = useUpdateHealthSettings()
  const [status, setStatus] = useState<TSaveStatus>('idle')
  const [choice, setChoice] = useState<TUpdateHealthSettingsRequest>(() => ({
    bmiStandard: userData?.bmiStandard ?? 'kemenkes',
    labUnits: userData?.labUnits ?? 'conventional',
  }))
  const latest = useRef(choice)

  useEffect(() => {
    if (!userData) return
    const next = {
      bmiStandard: userData.bmiStandard ?? latest.current.bmiStandard,
      labUnits: userData.labUnits ?? latest.current.labUnits,
    }
    latest.current = next
    setChoice(next)
  }, [userData])

  const save = async (change: Partial<TUpdateHealthSettingsRequest>) => {
    const next = { ...latest.current, ...change }
    latest.current = next
    setChoice(next)
    setStatus('saving')
    const isSaved = await mutate(next)
    setStatus(isSaved ? 'saved' : 'error')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          {t('settings.health.title')}
          <span className="text-xs font-normal text-muted-foreground">
            <SaveStatus status={status} />
          </span>
        </CardTitle>
        <CardDescription>{t('settings.health.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChoiceCards<TBmiStandard>
          label={t('settings.health.bmiStandard')}
          hint={t(`settings.health.bmiStandardHint.${choice.bmiStandard}`)}
          value={choice.bmiStandard}
          onChange={(value) => void save({ bmiStandard: value })}
          className="grid-cols-3"
          options={(['kemenkes', 'who', 'asiaPacific'] as const).map(
            (value) => ({
              value,
              label: t(`settings.health.bmiStandards.${value}`),
            }),
          )}
        />
        <ChoiceCards<TLabUnits>
          label={t('settings.health.labUnits')}
          hint={t('settings.health.labUnitsHint')}
          value={choice.labUnits}
          onChange={(value) => void save({ labUnits: value })}
          className="grid-cols-2"
          options={(['conventional', 'si'] as const).map((value) => ({
            value,
            label: t(`settings.health.units.${value}`),
          }))}
        />
      </CardContent>
    </Card>
  )
}
