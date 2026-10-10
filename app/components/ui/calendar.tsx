import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'
import { DayPicker } from 'react-day-picker'

import { variantClassName } from '~/components/ui/button'
import { cn } from '~/lib/utils/shadcn'

// shadcn/ui calendar (react-day-picker).
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...properties
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'relative flex flex-col gap-4',
        month: 'flex w-full flex-col gap-4',
        month_caption: 'flex h-8 items-center justify-center',
        caption_label: 'text-sm font-medium',
        nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
        button_previous: cn(
          variantClassName({ variant: 'outline' }),
          'size-8 p-0 opacity-70 hover:opacity-100',
        ),
        button_next: cn(
          variantClassName({ variant: 'outline' }),
          'size-8 p-0 opacity-70 hover:opacity-100',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'w-9 text-[0.8rem] font-normal text-muted-foreground',
        week: 'mt-1 flex w-full',
        day: 'relative size-9 p-0 text-center text-sm',
        day_button: cn(
          variantClassName({ variant: 'ghost' }),
          'size-9 rounded-md p-0 font-normal aria-selected:opacity-100',
        ),
        selected:
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
        today: '[&>button]:bg-accent [&>button]:text-accent-foreground',
        outside: 'text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-50',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({
          orientation,
        }: {
          orientation?: 'up' | 'down' | 'left' | 'right'
        }) =>
          orientation === 'left' ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
      }}
      {...properties}
    />
  )
}

export { Calendar }
