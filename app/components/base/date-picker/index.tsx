import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { enUS, id as indonesian } from 'react-day-picker/locale'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { cn } from '~/lib/utils/shadcn'

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
  if (orientation === 'right') return <ChevronRight className="size-4" />
  return <ChevronDown className="size-3.5 text-muted-foreground" />
}

export const DatePicker = (properties: TProperties) => {
  const { name, label, required, defaultOpen = false } = properties
  const { control } = useFormContext()
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const locale = i18n.language === 'id' ? indonesian : enUS
  const format = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = (field.value as string) || ''
        const dateLabel = value
          ? format.format(toDate(value))
          : t('datePicker.choose')
        const choose = (next: string) => {
          field.onChange(next)
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
              onOpenChange={setIsOpen}
            >
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-9 w-full min-w-0 justify-start gap-2 rounded-md px-3 text-base font-normal md:text-sm',
                      !value && 'text-muted-foreground',
                    )}
                    title={dateLabel}
                  >
                    <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 truncate">{dateLabel}</span>
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                className="glass-surface w-auto p-0"
                align="start"
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
                  selected={value ? toDate(value) : undefined}
                  defaultMonth={value ? toDate(value) : undefined}
                  onSelect={(date) => date && choose(toValue(date))}
                  autoFocus // eslint-disable-line jsx-a11y/no-autofocus
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
