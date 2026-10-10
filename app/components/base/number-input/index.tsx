import { Calculator } from 'lucide-react'
import {
  ChangeEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

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
import {
  evaluateExpression,
  isExpression,
  normalizeExpression,
} from '~/lib/utils/math-expression'
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
  // Accept a calculation ("((24/22)*28500000)/4"); the field holds its
  // result.
  allowMath?: boolean
  // A button that switches phones to a keyboard with + - * / ( ), which
  // the number keypad lacks.
  calculatorKeyboard?: boolean
  // Decimals a calculated result is rounded to (the currency's); unrounded
  // when not given (exchange rates).
  fractionDigits?: number
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
// as text ("1234567.5"); the schema turns it into a number. With
// `allowMath`, a typed calculation stays as typed, its result shown below
// and held by the form, until the field is left.
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
    allowMath,
    calculatorKeyboard,
    fractionDigits,
  } = properties
  const { t } = useTranslation()
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
  // The calculation as typed, and the value it gave the form.
  const [draft, setDraft] = useState<{ text: string; value: string }>()
  const [isCalculatorKeyboard, setIsCalculatorKeyboard] = useState(false)
  // A value set from elsewhere (a reset after saving) ends the calculation.
  const activeDraft =
    draft && String(value ?? '') === draft.value ? draft : undefined

  useEffect(() => {
    if (draft && String(value ?? '') !== draft.value) setDraft(undefined)
  }, [draft, value])

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
          if (allowMath) {
            const expression = normalizeExpression(
              input.value,
              thousand,
              decimal,
            )
            if (isExpression(expression)) {
              const evaluated = evaluateExpression(expression)
              const result =
                evaluated === undefined || fractionDigits === undefined
                  ? evaluated
                  : Number(evaluated.toFixed(fractionDigits))
              // An unfinished calculation leaves text the schema rejects.
              const next = result === undefined ? input.value : String(result)
              setDraft({ text: input.value, value: next })
              field.onChange(next)
              return
            }
          }
          setDraft(undefined)
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
            <div className="relative">
              <FormControl>
                <UIInput
                  ref={(element) => {
                    inputReference.current = element
                    field.ref(element)
                  }}
                  // Only when given: an undefined id would replace the one
                  // the form control links the label to.
                  {...(id && { id })}
                  name={field.name}
                  aria-label={accessibleLabel}
                  title={accessibleLabel}
                  type="text"
                  inputMode={isCalculatorKeyboard ? 'text' : 'decimal'}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder={placeholder}
                  autoFocus={autoFocus} // eslint-disable-line jsx-a11y/no-autofocus
                  value={activeDraft?.text ?? display(raw, thousand, decimal)}
                  onChange={handleChange}
                  onBlur={() => {
                    setDraft(undefined)
                    field.onBlur()
                  }}
                  disabled={disabled}
                  className={cn(calculatorKeyboard && 'pr-10')}
                />
              </FormControl>
              {calculatorKeyboard && !disabled && (
                <button
                  type="button"
                  aria-label={t('numberInput.calculator')}
                  title={t('numberInput.calculator')}
                  aria-pressed={isCalculatorKeyboard}
                  // Keeps the field focused, so the keyboard just switches.
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setIsCalculatorKeyboard((current) => !current)
                    inputReference.current?.focus()
                  }}
                  className={cn(
                    'absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
                    isCalculatorKeyboard
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Calculator className="size-4" />
                </button>
              )}
            </div>
            {activeDraft && !Number.isNaN(Number(activeDraft.value)) && (
              <p
                aria-live="polite"
                className="text-xs text-muted-foreground tabular-nums"
              >
                = {display(activeDraft.value, thousand, decimal)}
              </p>
            )}
            {hint && <FormDescription>{hint}</FormDescription>}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
