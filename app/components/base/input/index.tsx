import { useId } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input as UIInput,
} from '~/components/ui'
import { cn } from '~/lib/utils'

import { TProps } from './type'

export const Input = <TFormValues extends Record<string, unknown>>(
  props: TProps<TFormValues>,
) => {
  const generatedId = useId()
  const {
    id = generatedId,
    name,
    label,
    type = 'text',
    onClick,
    hint,
    className,
    containerClassName,
    inputClassName,
    labelClassName,
    required,
    leftNode: LeftNode,
    rightNode: RightNode,
    ...rest
  } = props
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('space-y-1', className)}>
          {label && (
            <FormLabel
              htmlFor={id}
              className={cn(labelClassName)}
            >
              {label} {required && <sup className="text-red-500">*</sup>}
            </FormLabel>
          )}
          <div
            className={cn(
              'relative flex items-center gap-x-3.5 rounded-md border border-input',
              containerClassName,
            )}
          >
            {LeftNode && (
              <LeftNode className="ml-3.5 h-4 w-4 cursor-pointer text-muted-foreground" />
            )}
            <FormControl>
              <UIInput
                id={id}
                type={type}
                className={cn(
                  'border-0 focus:outline-none focus-visible:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
                  LeftNode && 'pl-0',
                  RightNode && 'pr-0',
                  inputClassName,
                )}
                onClick={onClick}
                {...field}
                {...rest}
              />
            </FormControl>
            {RightNode && (
              <RightNode className="mr-3.5 h-4 w-4 cursor-pointer text-muted-foreground" />
            )}
          </div>
          {hint && <FormDescription>{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
