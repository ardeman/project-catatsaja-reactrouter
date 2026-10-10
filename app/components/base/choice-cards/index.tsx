import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Check } from 'lucide-react'
import { ReactNode, useId } from 'react'

import { Label } from '~/components/ui/label'
import { cn } from '~/lib/utils/shadcn'

type TChoice<T extends string> = {
  value: T
  label: ReactNode
  // Shown above the label: an icon or a small sample.
  visual?: ReactNode
}

type TProperties<T extends string> = {
  label: ReactNode
  hint?: ReactNode
  value: T | undefined
  onChange: (value: T) => void
  options: TChoice<T>[]
  disabled?: boolean
  className?: string
}

// A row of large, labelled options; one is always chosen. Arrow keys move
// between them like any radio group.
export const ChoiceCards = <T extends string>(properties: TProperties<T>) => {
  const { label, hint, value, onChange, options, disabled, className } =
    properties
  const id = useId()

  return (
    <div className="grid gap-2">
      <Label id={`${id}-label`}>{label}</Label>
      <RadioGroupPrimitive.Root
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        value={value}
        onValueChange={(next) => {
          // Radix reports "" when the options change under it.
          if (next) onChange(next as T)
        }}
        disabled={disabled}
        className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3', className)}
      >
        {options.map((option) => (
          <RadioGroupPrimitive.Item
            key={option.value}
            value={option.value}
            className="group relative flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-lg border bg-background px-3 py-3 text-center text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/10 data-[state=checked]:text-foreground"
          >
            <span className="absolute top-1.5 right-1.5 hidden rounded-full bg-primary p-0.5 text-primary-foreground group-data-[state=checked]:block">
              <Check className="size-3" />
            </span>
            {option.visual}
            <span className="font-medium">{option.label}</span>
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>
      {hint && (
        <p
          id={`${id}-hint`}
          className="text-[0.8rem] text-muted-foreground"
        >
          {hint}
        </p>
      )}
    </div>
  )
}
