import { ChangeEvent, useLayoutEffect, useRef } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input as UIInput } from '~/components/ui/input'
import { useUserData } from '~/lib/hooks/use-get-user'
import { getDefaultCurrencyFormat } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'

type TProperties = {
  name: string
  id?: string
  label?: string
  accessibleLabel?: string
  hint?: string
  required?: boolean
  placeholder?: string
  autoFocus?: boolean
  disabled?: boolean
  className?: string
}

// "1234567.5" → "1,234,567.5" with the person's separators. A typed decimal
// mark with nothing after it ("12.") is kept so typing can continue.
const display = (raw: string, thousand: string, decimal: string) => {
  if (raw === '') return ''
  const [integer, fraction] = raw.split('.')
  const grouped = integer.replaceAll(/\B(?=(\d{3})+(?!\d))/g, thousand)
  return fraction === undefined ? grouped : `${grouped}${decimal}${fraction}`
}

// What was typed → digits with an optional "." decimal mark.
const parse = (text: string, thousand: string, decimal: string) => {
  let cleaned = text.replaceAll(thousand, '')
  // Phone keyboards may offer only "." or ",": take either as the decimal
  // mark when it isn't the thousands separator.
  if (decimal !== '.' && thousand !== '.')
    cleaned = cleaned.replaceAll('.', decimal)
  if (decimal !== ',' && thousand !== ',')
    cleaned = cleaned.replaceAll(',', decimal)
  cleaned = cleaned.replaceAll(decimal, '.').replaceAll(/[^\d.]/g, '')
  const [integer, ...rest] = cleaned.split('.')
  const fraction = rest.join('')
  const digits = integer.replace(/^0+(?=\d)/, '')
  return rest.length > 0 ? `${digits || '0'}.${fraction}` : digits
}

// A number field that shows thousands separators while typing, using the
// separators from the person's currency format. The form gets the number
// as text ("1234567.5"); the schema turns it into a number.
export const NumberInput = (properties: TProperties) => {
  const {
    name,
    id,
    label,
    accessibleLabel,
    hint,
    required,
    placeholder,
    autoFocus,
    disabled,
    className,
  } = properties
  const { control } = useFormContext()
  const { data: userData } = useUserData()
  const format = userData?.currencyFormat ?? getDefaultCurrencyFormat()
  const thousand = format.thousandSeparator
  const decimal = format.decimalSeparator
  const inputReference = useRef<HTMLInputElement>(null)
  // Digits (and decimal mark) before the caret, to put it back after React
  // shows the reformatted value.
  const pendingCaret = useRef<number>(undefined)
  const value = useWatch({ control, name })

  useLayoutEffect(() => {
    const element = inputReference.current
    const digitsBefore = pendingCaret.current
    if (!element || digitsBefore === undefined) return
    pendingCaret.current = undefined
    const shown = element.value
    let seen = 0
    let position = 0
    while (position < shown.length && seen < digitsBefore) {
      if (/\d/.test(shown[position]) || shown[position] === decimal) seen++
      position++
    }
    element.setSelectionRange(position, position)
  }, [value, decimal])

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const raw =
          field.value === undefined || field.value === null
            ? ''
            : String(field.value)

        const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
          const input = event.target
          const caret = input.selectionStart ?? input.value.length
          // Keep the caret after the same number of digits once separators
          // are added or removed.
          const digitsBefore = input.value
            .slice(0, caret)
            .replaceAll(
              new RegExp(
                String.raw`[^\d${decimal === '.' ? String.raw`\.` : decimal}]`,
                'g',
              ),
              '',
            ).length
          pendingCaret.current = digitsBefore
          field.onChange(parse(input.value, thousand, decimal))
        }

        return (
          <FormItem
            className={cn('[&>:not([hidden])~:not([hidden])]:mt-1', className)}
          >
            {label && (
              <FormLabel>
                {label} {required && <sup className="text-destructive">*</sup>}
              </FormLabel>
            )}
            <FormControl>
              <UIInput
                ref={(element) => {
                  inputReference.current = element
                  field.ref(element)
                }}
                id={id}
                name={field.name}
                aria-label={accessibleLabel}
                title={accessibleLabel}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder={placeholder}
                autoFocus={autoFocus} // eslint-disable-line jsx-a11y/no-autofocus
                value={display(raw, thousand, decimal)}
                onChange={handleChange}
                onBlur={field.onBlur}
                disabled={disabled}
              />
            </FormControl>
            {hint && <FormDescription>{hint}</FormDescription>}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
