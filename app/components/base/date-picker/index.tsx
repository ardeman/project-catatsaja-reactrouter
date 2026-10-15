import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { enUS, id as indonesian } from 'react-day-picker/locale'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { useUserData } from '~/lib/hooks/use-get-user'
import { dateFormats, parseDateInput } from '~/lib/utils/date-input'

import { DateInput } from './date-input'

type TProperties = {
  // Holds a date as YYYY-MM-DD.
  name: string
  label?: string
  required?: boolean
  defaultOpen?: boolean
}

const toDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const toValue = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

const daysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toValue(date)
}

// The years offered: from 1900 (birth dates) to ten years ahead.
const FIRST_MONTH = new Date(1900, 0)
const lastMonth = () => new Date(new Date().getFullYear() + 10, 11)

const dropdownClassNames = {
  month_caption: 'flex h-8 items-center justify-center',
  dropdowns: 'flex items-center gap-1.5',
  // The native select sits invisibly over its label, so phones get their
  // own month and year wheels.
  dropdown_root:
    'relative inline-flex h-8 items-center rounded-md border px-2 text-sm font-medium hover:bg-accent has-focus-visible:ring-2 has-focus-visible:ring-ring',
  dropdown: 'absolute inset-0 cursor-pointer opacity-0',
  caption_label: 'flex items-center gap-1 text-sm font-medium',
}

const Chevron = ({
  orientation,
}: {
  orientation?: 'up' | 'down' | 'left' | 'right'
}) => {
  if (orientation === 'left') return <ChevronLeft className="size-4" />
  return orientation === 'right' ? (
    <ChevronRight className="size-4" />
  ) : (
    <ChevronDown className="size-3.5 text-muted-foreground" />
  )
}

export const DatePicker = (properties: TProperties) => {
  const { name, label, required, defaultOpen = false } = properties
  const { control } = useFormContext()
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [selection, setSelection] = useState(0)
  // Opened from the text field: focus stays there so typing still works.
  const [isFromInput, setIsFromInput] = useState(false)
  const anchor = useRef<HTMLDivElement>(null)
  const { data: userData } = useUserData()
  const dateFormat =
    userData?.dateFormat && dateFormats.includes(userData.dateFormat)
      ? userData.dateFormat
      : 'DD-MM-YYYY'
  const locale = i18n.language === 'id' ? indonesian : enUS

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = (field.value as string) || ''
        const validValue =
          parseDateInput(value, 'YYYY-MM-DD') === value ? value : ''
        const choose = (next: string) => {
          field.onChange(next)
          setSelection((current) => current + 1)
          setIsOpen(false)
        }
        return (
          <FormItem className="min-w-0 [&>:not([hidden])~:not([hidden])]:mt-1">
            {label && (
              <FormLabel>
                {label} {required && <sup className="text-destructive">*</sup>}
              </FormLabel>
            )}
            <Popover
              open={isOpen}
              onOpenChange={(open) => {
                setIsFromInput(false)
                setIsOpen(open)
              }}
            >
              <PopoverAnchor asChild>
                <div
                  ref={anchor}
                  className="relative"
                >
                  <DateInput
                    key={selection}
                    value={value}
                    format={dateFormat}
                    label={label ?? t('datePicker.choose')}
                    required={required}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    onFocus={() => {
                      if (isOpen) return
                      setIsFromInput(true)
                      setIsOpen(true)
                    }}
                    inputRef={field.ref}
                  />
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-full w-9"
                      aria-label={t('datePicker.openCalendar')}
                      title={t('datePicker.openCalendar')}
                    >
                      <CalendarDays className="size-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                </div>
              </PopoverAnchor>
              <PopoverContent
                className="glass-surface w-auto p-0"
                align="start"
                onOpenAutoFocus={(event) => {
                  if (isFromInput) event.preventDefault()
                }}
                onCloseAutoFocus={(event) => {
                  if (isFromInput) event.preventDefault()
                }}
                // Clicking or focusing the field keeps the calendar open.
                onInteractOutside={(event) => {
                  if (
                    event.target instanceof Node &&
                    anchor.current?.contains(event.target)
                  )
                    event.preventDefault()
                }}
              >
                <Calendar
                  mode="single"
                  locale={locale}
                  // Month and year chosen directly (a birth date is decades
                  // back), as well as stepped with the arrows.
                  captionLayout="dropdown"
                  startMonth={FIRST_MONTH}
                  endMonth={lastMonth()}
                  formatters={{
                    formatMonthDropdown: (month) =>
                      month.toLocaleString(i18n.language, { month: 'short' }),
                  }}
                  classNames={dropdownClassNames}
                  components={{ Chevron }}
                  selected={validValue ? toDate(validValue) : undefined}
                  defaultMonth={validValue ? toDate(validValue) : undefined}
                  onSelect={(date) => date && choose(toValue(date))}
                  // Follows a date typed in the field.
                  key={validValue}
                  autoFocus={!isFromInput} // eslint-disable-line jsx-a11y/no-autofocus -- moves into the calendar only when opened from its button
                />
                <div className="flex gap-2 border-t p-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 flex-1"
                    onClick={() => choose(daysAgo(0))}
                  >
                    {t('datePicker.today')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 flex-1"
                    onClick={() => choose(daysAgo(1))}
                  >
                    {t('datePicker.yesterday')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
