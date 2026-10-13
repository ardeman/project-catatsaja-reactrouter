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
  const [integer, fraction] = raw.split('.', 2)
  const grouped = integer.replaceAll(/\B(?=(\d{3})+(?!\d))/g, () => thousand)
  return fraction === undefined ? grouped : `${grouped}${decimal}${fraction}`
}

const escape = (text: string) =>
  text.replaceAll(/[\\^$.*+?()[\]{}|-]/g, String.raw`\$&`)

// Characters the caret is placed by: in a number its digits and decimal
// mark; in a calculation everything but the thousands separators (which
// come and go as it is regrouped), so it stays after an operator too.
const isCaretMark = (
  char: string,
  isExpression: boolean,
  thousand: string,
  decimal: string,
) => (isExpression ? char !== thousand : /\d/.test(char) || char === decimal)

// Whether a mouse button or finger is down anywhere, tracked from the first
// number field on: see `onBlur` below.
const pointer = { isDown: false, isTracked: false }
const trackPointer = () => {
  if (pointer.isTracked) return
  pointer.isTracked = true
  const release = () => {
    pointer.isDown = false
  }
  addEventListener(
    'pointerdown',
    () => {
      pointer.isDown = true
    },
    true,
  )
  addEventListener('pointerup', release, true)
  addEventListener('pointercancel', release, true)
}

// A typed calculation with each number grouped like a plain number
// ("10 000+11900" → "10 000+11 900"), the operators left as typed. Either
// "." or "," counts as the decimal mark when it isn't the thousands
// separator, as in `parse`.
const groupNumbers = (text: string, thousand: string, decimal: string) => {
  const marks = [decimal, '.', ','].filter(
    (mark, index, all) => mark !== thousand && all.indexOf(mark) === index,
  )
  const integer = thousand
    ? String.raw`\d(?:${escape(thousand)}?\d)*`
    : String.raw`\d+`
  const number = new RegExp(
    String.raw`${integer}(?:[${marks.map((mark) => escape(mark)).join('')}]\d*)?`,
    'g',
  )
  return text.replaceAll(number, (match) =>
    display(parse(match, thousand, decimal), thousand, decimal),
  )
}

// What was typed → digits with an optional "." decimal mark.
const parse = (text: string, thousand: string, decimal: string) => {
  let cleaned = text.replaceAll(thousand, '')
  // Phone keyboards may offer only "." or ",": take either as the decimal
  // mark when it isn't the thousands separator.
  if (decimal !== '.' && thousand !== '.')
    cleaned = cleaned.replaceAll('.', () => decimal)
  if (decimal !== ',' && thousand !== ',')
    cleaned = cleaned.replaceAll(',', () => decimal)
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
  // What was before the caret, to put it back there after React shows the
  // reformatted value.
  const pendingCaret = useRef<{ count: number; isExpression: boolean }>(
    undefined,
  )
  const value = useWatch({ control, name })
  // The calculation as typed, and the value it gave the form.
  const [draft, setDraft] = useState<{ text: string; value: string }>()
  const [isCalculatorKeyboard, setIsCalculatorKeyboard] = useState(false)
  // A value set from elsewhere (a reset after saving) ends the calculation.
  if (draft && String(value ?? '') !== draft.value) setDraft(undefined)
  const activeDraft =
    draft && String(value ?? '') === draft.value ? draft : undefined

  useEffect(() => {
    if (allowMath) trackPointer()
  }, [allowMath])

  useLayoutEffect(() => {
    const element = inputReference.current
    const pending = pendingCaret.current
    if (!element || pending === undefined) return
    pendingCaret.current = undefined
    const shown = element.value
    let seen = 0
    let position = 0
    while (position < shown.length && seen < pending.count) {
      if (isCaretMark(shown[position], pending.isExpression, thousand, decimal))
        seen++
      position++
    }
    element.setSelectionRange(position, position)
  }, [value, thousand, decimal, draft?.text])

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const raw =
          field.value === undefined || field.value === null
            ? ''
            : String(field.value)

        // What is before the caret, so it stays there once separators are
        // added or removed.
        const caretOf = (input: HTMLInputElement, isExpression: boolean) => {
          const caret = input.selectionStart ?? input.value.length
          let count = 0
          for (const char of input.value.slice(0, caret))
            if (isCaretMark(char, isExpression, thousand, decimal)) count++
          return { count, isExpression }
        }

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
              // Every number grouped the same way, the caret kept after the
              // same digits.
              pendingCaret.current = caretOf(input, true)
              setDraft({
                text: groupNumbers(input.value, thousand, decimal),
                value: next,
              })
              field.onChange(next)
              return
            }
          }
          setDraft(undefined)
          pendingCaret.current = caretOf(input, false)
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
                    field.onBlur()
                    // Ending the calculation removes the result line under
                    // the field. If a press moved the focus (Save, Cancel),
                    // wait until it is released and its click has landed,
                    // or the button moves away from under the pointer.
                    const end = () => setDraft(undefined)
                    if (pointer.isDown)
                      addEventListener('pointerup', () => setTimeout(end, 0), {
                        once: true,
                      })
                    else end()
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
