import { useTranslation } from 'react-i18next'

import {
  ChartTooltip as BaseChartTooltip,
  TChartTooltipRow,
} from '~/components/base/chart-tooltip'
import { formatPeriod, TGranularity } from '~/lib/utils/finance-analysis'

type TProperties = {
  // The period shown: its first day and how long it is.
  start: string
  granularity: TGranularity
  rows: TChartTooltipRow[]
  x: number
  width: number
}

// The readout of one period of a book: titled by the period ("Week of …").
export const ChartTooltip = ({ start, granularity, ...rest }: TProperties) => {
  const { t, i18n } = useTranslation()
  const date = formatPeriod({
    start,
    granularity,
    locale: i18n.language,
    withYear: true,
  })
  return (
    <BaseChartTooltip
      title={
        granularity === 'week' ? t('finances.analysis.weekOf', { date }) : date
      }
      {...rest}
    />
  )
}
