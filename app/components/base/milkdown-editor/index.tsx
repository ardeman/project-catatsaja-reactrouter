import { Editor, defaultValueCtx, rootCtx } from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { Milkdown, useEditor } from '@milkdown/react'
import { nord } from '@milkdown/theme-nord'
import { useEffect } from 'react'
import { PathValue, useFormContext } from 'react-hook-form'

import { TMilkdownEditorProperties } from './type'

export const MilkdownEditor = <TFormValues extends Record<string, unknown>>(
  properties: TMilkdownEditorProperties<TFormValues>,
) => {
  const { name } = properties
  const { register, setValue, getValues } = useFormContext<TFormValues>()

  useEffect(() => {
    register(name)
  }, [register, name])

  useEditor(
    (root) =>
      Editor.make()
        .config((context) => {
          context.set(rootCtx, root)
          context.set(defaultValueCtx, (getValues(name) as string) || '')
          context.get(listenerCtx).markdownUpdated((_, markdown) => {
            setValue(name, markdown as PathValue<TFormValues, typeof name>, {
              shouldDirty: true,
            })
          })
        })
        .config(nord)
        .use(commonmark)
        .use(listener),
    [name, getValues, setValue],
  )

  return <Milkdown />
}
