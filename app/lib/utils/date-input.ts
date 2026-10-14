import type { TDateFormat } from '~/lib/types/date'

export const dateFormats: TDateFormat[] = [
  'DD-MM-YYYY',
  'MM-DD-YYYY',
  'YYYY-MM-DD',
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY/MM/DD',
  'DD MMM YYYY',
  'DD MMMM YYYY',
]

const toValue = (year: number, month: number, day: number) => {
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  if (
    year < 1900 ||
    year > 9999 ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Accept both languages regardless of the person's display language.
const monthNames = Array.from({ length: 12 }, (_, index) =>
  ['en', 'id'].flatMap((locale) =>
    (['short', 'long'] as const).map((month) =>
      new Intl.DateTimeFormat(locale, { month })
        .format(new Date(2026, index, 1))
        .toLowerCase()
        .replaceAll('.', ''),
    ),
  ),
)

const parseNamedDate = (value: string) => {
  const match = /^(\d{1,2})\s*([a-z]+)\.?\s*(\d{4})$/i.exec(value.trim())
  if (!match) return
  const month =
    monthNames.findIndex((names) => names.includes(match[2].toLowerCase())) + 1
  return toValue(Number(match[3]), month, Number(match[1]))
}

export const formatDateInput = (
  value: string,
  format: TDateFormat,
  locale = 'en',
) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return ''
  const [year, month, day] = value.split('-', 3)
  if (format.includes('MMM')) {
    const name = new Intl.DateTimeFormat(locale, {
      month: format === 'DD MMM YYYY' ? 'short' : 'long',
    }).format(new Date(Number(year), Number(month) - 1, Number(day)))
    return `${day} ${name} ${year}`
  }
  const parts = { YYYY: year, MM: month, DD: day }
  return format
    .split(/[-/]/)
    .map((part) => parts[part as keyof typeof parts])
    .join(format.includes('/') ? '/' : '-')
}

export const maskDateInput = (
  value: string,
  format: TDateFormat,
  locale = 'en',
): string => {
  if (/[a-z]/i.test(value) || format.includes('MMM')) {
    const parsed =
      parseNamedDate(value) ??
      (format.includes('MMM') && /^\d{8}$/.test(value)
        ? parseDateInput(value, 'DD-MM-YYYY')
        : undefined)
    return parsed
      ? formatDateInput(parsed, format, locale)
      : value
          .trimStart()
          .replaceAll(/(\d)([a-z])/gi, '$1 $2')
          .replaceAll(/([a-z.])(\d)/gi, '$1 $2')
          .replaceAll(/\s+/g, ' ')
  }
  const lengths = format.split(/[-/]/).map((part) => part.length)
  const digits = value.replaceAll(/\D/g, '').slice(0, 8)
  let offset = 0
  return lengths
    .map((length) => {
      const part = digits.slice(offset, offset + length)
      offset += length
      return part
    })
    .filter(Boolean)
    .join(format.includes('/') ? '/' : '-')
}

export const parseDateInput = (
  value: string,
  format: TDateFormat,
): string | undefined => {
  if (!value) return ''
  if (/[a-z]/i.test(value)) return parseNamedDate(value)
  const numericFormat = format.includes('MMM') ? 'DD-MM-YYYY' : format
  const masked = maskDateInput(value, numericFormat)
  if (masked.length !== 10) return
  const parts = Object.fromEntries(
    numericFormat
      .split(/[-/]/)
      .map((part, index) => [part, Number(masked.split(/[-/]/)[index])]),
  )
  return toValue(parts.YYYY, parts.MM, parts.DD)
}
