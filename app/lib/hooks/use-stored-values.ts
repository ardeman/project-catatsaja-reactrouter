import { useEffect, useRef } from 'react'
import type {
  FieldValues,
  Path,
  PathValue,
  UseFormReturn,
} from 'react-hook-form'

import { isSameJson, mergeValue } from '~/lib/utils/merge-stored'

type TProperties<T extends FieldValues> = {
  form: UseFormReturn<T>
  // The item as stored now, in the form's shape (the form's `defaultValues`
  // on the first render).
  stored: T
  // How to merge a field, if not as one value (`mergeById` for lists).
  merge?: { [K in keyof T]?: (base: T[K], local: T[K], remote: T[K]) => T[K] }
}

// Brings changes saved elsewhere into a detail form without losing what was
// changed here and not saved yet. A field counts as changed here when it
// differs from the stored value the form last took in. React Hook Form's
// `keepDirtyValues` can't be used: it never clears a field's dirty flag, so
// after one edit the form kept its own copy for good, and autosave wrote
// back entries deleted on another device.
export const useStoredValues = <T extends FieldValues>(
  properties: TProperties<T>,
) => {
  const { form, stored, merge } = properties
  const base = useRef(stored)
  const mergeReference = useRef(merge)
  const storedJson = JSON.stringify(stored)

  useEffect(() => {
    mergeReference.current = merge
  })

  useEffect(() => {
    const previous = base.current
    const next = JSON.parse(storedJson) as T
    base.current = next
    for (const name of Object.keys(next) as (keyof T & string)[]) {
      const remote = next[name]
      if (isSameJson(previous[name], remote)) continue
      const field = name as Path<T>
      const local = form.getValues(field) as T[typeof name]
      const mergeField = mergeReference.current?.[name] ?? mergeValue
      const merged = mergeField(previous[name], local, remote)
      if (!isSameJson(merged, local))
        form.setValue(field, merged as PathValue<T, Path<T>>)
    }
  }, [form, storedJson])
}
