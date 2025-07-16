import { useId } from 'react'
import { useFormContext } from 'react-hook-form'

import { Checkbox as UICheckbox } from '~/components/ui/checkbox'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { cn } from '~/lib/utils/shadcn'

import { TProperties } from './type'

export const Checkbox = <TFormValues extends Record<string, unknown>>(
  properties: TProperties<TFormValues>,
) => {
  const generatedId = useId()
  const {
    id = generatedId,
    name,
    label,
    rightNode,
    leftNode,
    hint,
    className,
    containerClassName,
    labelClassName,
    inputClassName,
    required,
    ...rest
  } = properties
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('space-y-1', className)}>
          <div className={cn('flex items-center gap-2', containerClassName)}>
            {leftNode && leftNode}
            <FormControl>
              <UICheckbox
                id={id}
                className={cn(inputClassName)}
                checked={field.value}
                onCheckedChange={field.onChange}
                {...rest}
              />
            </FormControl>
            {label && (
              <FormLabel
                htmlFor={id}
                className={labelClassName}
              >
                {label} {required && <sup className="text-red-500">*</sup>}
              </FormLabel>
            )}
            {rightNode && rightNode}
          </div>
          {hint && <FormDescription>{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
