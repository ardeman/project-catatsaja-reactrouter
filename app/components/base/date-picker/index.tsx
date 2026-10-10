import { CalendarDays } from 'lucide-react'
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

export const DatePicker = (properties: TProperties) => {
  const { name, label, required } = properties
  const { control } = useFormContext()
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
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
        const choose = (next: string) => {
          field.onChange(next)
          setIsOpen(false)
        }
        return (
          <FormItem className="[&>:not([hidden])~:not([hidden])]:mt-1">
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
                      'h-9 w-full justify-start gap-2 rounded-md px-3 text-base font-normal md:text-sm',
                      !value && 'text-muted-foreground',
                    )}
                  >
                    <CalendarDays className="size-4 text-muted-foreground" />
                    {value
                      ? format.format(toDate(value))
                      : t('datePicker.choose')}
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
