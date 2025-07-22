import { Crepe } from '@milkdown/crepe'
import { editorViewCtx } from '@milkdown/kit/core'
import { Milkdown, useEditor, useInstance } from '@milkdown/react'
import { useCallback } from 'react'
import { PathValue, useFormContext } from 'react-hook-form'

import { TMilkdownEditorProperties } from './type'

import '@milkdown/crepe/theme/common/style.css'
import '~/styles/crepe.css'

export const MilkdownEditor = <TFormValues extends Record<string, unknown>>(
  properties: TMilkdownEditorProperties<TFormValues>,
) => {
  const { name, placeholder: placeholderText } = properties
  const { register, setValue, getValues } = useFormContext<TFormValues>()
  const { ref } = register(name)
  const [, getEditor] = useInstance()

  useEditor((root) =>
    new Crepe({
      root,
      defaultValue: (getValues(name) as string) || '',
      features: {
        [Crepe.Feature.BlockEdit]: false,
      },
      featureConfigs: {
        [Crepe.Feature.Placeholder]: {
          text: placeholderText,
          mode: 'doc',
        },
      },
    }).on((listener) => {
      listener.markdownUpdated((_, markdown) => {
        setValue(name, markdown as PathValue<TFormValues, typeof name>, {
          shouldDirty: true,
        })
      })
    }),
  )

  const handleReference = useCallback(
    (element: HTMLTextAreaElement | null) => {
      ref(element)
    },
    [ref],
  )

  const handleFocus = () => {
    const instance = getEditor()
    if (instance?.action) {
      instance.action((context) => {
        const view = context.get(editorViewCtx)
        view.focus()
      })
    }
  }

  return (
    <>
      <textarea
        ref={handleReference}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onFocus={handleFocus}
      />
      <Milkdown />
    </>
  )
}
