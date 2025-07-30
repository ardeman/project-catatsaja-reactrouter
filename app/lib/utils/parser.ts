import { TFunction } from 'i18next'

import { TCurrencyFormatRequest, TCurrency } from '~/lib/types/settings'

export const extractPathSegment = (path: string) => {
  // Split the path into segments
  const segments = path.split('/').filter(Boolean)

  // Assuming the dynamic segment is always the first one, the desired part will be the second segment if it exists
  const desiredSegment = segments.length > 0 ? `/${segments[0]}` : '/'

  return desiredSegment
}

export const getRandomIndex = ({
  arrayLength,
  currentIndex,
}: {
  arrayLength: number
  currentIndex: number
}) => {
  let randomIndex = Math.floor(Math.random() * arrayLength)
  // Ensure the random index is not the same as the current one
  while (randomIndex === currentIndex) {
    randomIndex = Math.floor(Math.random() * arrayLength)
  }
  return randomIndex
}

export const getDateLabel = ({
  updatedAt,
  createdAt,
  t,
  locale,
}: {
  updatedAt?: number
  createdAt: number
  t: TFunction
  locale: string
}) => {
  const date = updatedAt || createdAt
  const label = updatedAt ? 'edited' : 'created'
  const dateLabel = t(`time.${label}`, {
    time: formatDate({ timestamp: date, locale }),
  })

  return dateLabel
}

const formatDate = ({
  timestamp,
  locale,
}: {
  timestamp: number
  locale: string
}) =>
  new Date(timestamp * 1000).toLocaleDateString(locale, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export const formatCurrency = ({
  amount,
  format,
  currencies,
  currency,
}: {
  amount: number
  format: TCurrencyFormatRequest
  currencies?: TCurrency[]
  currency?: TCurrency
}): string => {
  // Find the default currency from the currencies list
  const defaultCurrency =
    currency || currencies?.find((currency) => currency.isDefault)

  // Use default currency settings if found, otherwise use fallback values
  const currencyCode = defaultCurrency?.code || 'IDR'
  const currencySymbol = defaultCurrency?.symbol || 'Rp'
  const maximumFractionDigits =
    defaultCurrency?.maximumFractionDigits ?? format.minimumFractionDigits

  // Ensure minimumFractionDigits doesn't exceed maximumFractionDigits
  const actualMinFractionDigits = Math.min(
    format.minimumFractionDigits,
    maximumFractionDigits,
  )
  const actualMaxFractionDigits = Math.max(
    actualMinFractionDigits,
    maximumFractionDigits,
  )

  // Use floor instead of rounding for currency formatting
  const flooredAmount =
    Math.floor(amount * Math.pow(10, actualMaxFractionDigits)) /
    Math.pow(10, actualMaxFractionDigits)

  const formattedNumber = flooredAmount.toLocaleString('en-US', {
    minimumFractionDigits: actualMinFractionDigits,
    maximumFractionDigits: actualMaxFractionDigits,
    useGrouping: false,
  })

  // Split the number into integer and decimal parts
  const [integerPart, decimalPart] = formattedNumber.split('.')

  // Add thousand separators to the integer part
  const addThousandSeparators = (
    number_: string,
    separator: string,
  ): string => {
    return number_.replaceAll(/\B(?=(\d{3})+(?!\d))/g, separator)
  }

  let result = addThousandSeparators(integerPart, format.thousandSeparator)

  // Add decimal part if it exists
  if (decimalPart !== undefined) {
    result += format.decimalSeparator + decimalPart
  }

  // Determine the currency text to use
  const currencyText =
    format.currencyType === 'code' ? currencyCode : currencySymbol

  // Add space if requested
  const space = format.addSpace ? ' ' : ''

  // Add currency based on placement
  result =
    format.currencyPlacement === 'before'
      ? `${currencyText}${space}${result}`
      : `${result}${space}${currencyText}`

  return result
}

export const getDefaultCurrencyFormat = (): TCurrencyFormatRequest => ({
  thousandSeparator: ',',
  decimalSeparator: '.',
  minimumFractionDigits: 2,
  currencyPlacement: 'before',
  currencyType: 'symbol',
  addSpace: false,
})
