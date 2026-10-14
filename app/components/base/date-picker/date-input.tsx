import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FormControl } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { TDateFormat } from '~/lib/types/date'
import {
  formatDateInput,
  maskDateInput,
  parseDateInput,
} from '~/lib/utils/date-input'

type TProperties = {
  value: string
  format: TDateFormat
  label: string
  required?: boolean
  onChange: (value: string) => void
  onBlur: () => void
  inputRef: (input: HTMLInputElement | null) => void
}

// Keep incomplete typing local; only real dates or an explicit clear reach
// the form. Native validity prevents submitting an unfinished or invalid date.
export const DateInput = ({
  value,
  format,
  label,
  required,
  onChange,
  onBlur,
  inputRef,
}: TProperties) => {
  const { t, i18n } = useTranslation()
  const [text, setText] = useState(() =>
    formatDateInput(value, format, i18n.language),
  )
  const lastValue = useRef(value)
  const lastFormat = useRef(format)
  const lastLanguage = useRef(i18n.language)
  const [invalid, setInvalid] = useState(false)
  useEffect(() => {
    if (
      value === lastValue.current &&
      format === lastFormat.current &&
      i18n.language === lastLanguage.current
    ) {
      return
    }

    setText(formatDateInput(value, format, i18n.language))
    setInvalid(false)
    lastValue.current = value
    lastFormat.current = format
    lastLanguage.current = i18n.language
  }, [value, format, i18n.language])
  const error = t('datePicker.invalid', { format })
  return (
    <FormControl>
      <Input
        ref={(input) => {
          inputRef(input)
          input?.setCustomValidity(
            parseDateInput(text, format) === undefined ? error : '',
          )
        }}
        value={text}
        aria-label={label}
        aria-invalid={invalid || undefined}
        placeholder={format}
        required={required}
        inputMode={format.includes('MMM') ? 'text' : 'numeric'}
        className="h-9 min-w-0 pr-10"
        onChange={(event) => {
          const next = maskDateInput(event.target.value, format, i18n.language)
          setText(next)
          setInvalid(false)
          const parsed = parseDateInput(next, format)
          event.target.setCustomValidity(parsed === undefined ? error : '')
          if (parsed === undefined) {
            return
          }

          lastValue.current = parsed
          onChange(parsed)
        }}
        onBlur={() => {
          setInvalid(parseDateInput(text, format) === undefined)
          onBlur()
        }}
        onInvalid={() => setInvalid(true)}
        title={invalid ? error : format}
      />
    </FormControl>
  )
}
