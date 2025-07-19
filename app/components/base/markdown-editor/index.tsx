import { lazy, Suspense, useId } from 'react'
import { useFormContext } from 'react-hook-form'

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

const MDEditor = lazy(() => import('@uiw/react-md-editor'))

export const MarkdownEditor = <TFormValues extends Record<string, unknown>>(
  properties: TProperties<TFormValues>,
) => {
  const generatedId = useId()
  const {
    id = generatedId,
    name,
    label,
    hint,
    className,
    containerClassName,
    labelClassName,
    inputClassName,
    required,
    placeholder,
    readOnly,
    autoFocus,
    onKeyDown,
    textareaProps,
  } = properties
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
          <div className={cn('relative', containerClassName)}>
            <FormControl>
              <Suspense fallback={null}>
                <MDEditor
                  value={field.value}
                  onChange={(value) => field.onChange(value || '')}
                  className={cn(inputClassName)}
                  textareaProps={{
                    id,
                    placeholder,
                    readOnly,
                    autoFocus,
                    onKeyDown,
                    ...textareaProps,
                  }}
                />
              </Suspense>
            </FormControl>
          </div>
          {hint && <FormDescription>{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
