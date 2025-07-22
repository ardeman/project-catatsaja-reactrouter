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
  const { name, placeholder: placeholderText, previousName } = properties
  const { register, setValue, getValues, setFocus } =
    useFormContext<TFormValues>()
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
      if (previousName) {
        listener.mounted((context) => {
          const view = context.get(editorViewCtx)
          const dom = (root as HTMLElement).querySelector<HTMLElement>(
            '.ProseMirror',
          )
          if (!dom) return
          const handler = (event: KeyboardEvent) => {
            const isBackspace = event.key === 'Backspace'
            const isArrowUp = event.key === 'ArrowUp'
            const isEmpty = view.state.doc.textContent.length === 0
            const atFirstLine = !view.state.doc
              .textBetween(0, view.state.selection.from)
              .includes('\n')
            if (isBackspace && isEmpty) {
              event.preventDefault()
              setFocus(previousName)
            } else if (isArrowUp && atFirstLine) {
              event.preventDefault()
              setFocus(previousName)
            }
          }
          dom.addEventListener('keydown', handler as EventListener)
          listener.destroy(() => {
            dom.removeEventListener('keydown', handler as EventListener)
          })
        })
      }
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
