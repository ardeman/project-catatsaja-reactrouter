import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/base/card'
import { ChoiceCards } from '~/components/base/choice-cards'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateDateFormat } from '~/lib/hooks/use-update-date-format'
import { TDateFormat } from '~/lib/types/date'
import { dateFormats, formatDateInput } from '~/lib/utils/date-input'

export const DateFormat = () => {
  const { t, i18n } = useTranslation()
  const { data } = useUserData()
  const stored = data?.dateFormat ?? 'DD-MM-YYYY'
  const [format, setFormat] = useState<TDateFormat>(stored)
  const { mutate, isPending } = useUpdateDateFormat()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.dateFormat.title')}</CardTitle>
        <CardDescription>
          {t('settings.dateFormat.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChoiceCards
          label={t('settings.dateFormat.title')}
          value={format}
          onChange={setFormat}
          disabled={isPending}
          className="grid-cols-2 sm:grid-cols-3"
          options={dateFormats.map((value) => ({
            value,
            label: value,
            visual: (
              <span className="font-mono text-sm">
                {formatDateInput('2026-10-14', value, i18n.language)}
              </span>
            ),
          }))}
        />
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          isLoading={isPending}
          disabled={isPending || format === stored}
          onClick={() => void mutate(format)}
        >
          {t('form.save')}
        </Button>
      </CardFooter>
    </Card>
  )
}
