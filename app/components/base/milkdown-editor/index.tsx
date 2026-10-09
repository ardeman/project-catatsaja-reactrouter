import { Crepe } from '@milkdown/crepe'
import { editorViewCtx } from '@milkdown/kit/core'
import { replaceAll } from '@milkdown/kit/utils'
import { Milkdown, useEditor } from '@milkdown/react'
import { useCallback, useEffect, useRef } from 'react'
import { PathValue, useFormContext } from 'react-hook-form'

import { TMilkdownEditorProperties } from './type'

import '@milkdown/crepe/theme/common/style.css'
import '~/styles/crepe.css'

export const MilkdownEditor = <TFormValues extends Record<string, unknown>>(
  properties: TMilkdownEditorProperties<TFormValues>,
) => {
  const {
    name,
    placeholder: placeholderText,
    previousName,
    readOnly = false,
    value,
    registerSync,
  } = properties
  const { register, setValue, getValues, setFocus, getFieldState } =
    useFormContext<TFormValues>()
  const { ref } = register(name)
  const crepeReference = useRef<Crepe>(undefined)
  const readOnlyReference = useRef(readOnly)
  // Markdown this component put into the editor itself, so the change
  // listener does not report it back as an edit.
  const appliedMarkdown = useRef<string>(undefined)

  useEditor((root) => {
    const crepe = new Crepe({
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
    })
    crepe.setReadonly(readOnlyReference.current)
    crepe.on((listener) => {
      listener.markdownUpdated((_, markdown) => {
        if (markdown === appliedMarkdown.current) return
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
            const atStart = view.state.selection.from === 1
            if (isBackspace && isEmpty) {
              event.preventDefault()
              setFocus(previousName)
            } else if (isArrowUp && atStart) {
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
    })
    crepeReference.current = crepe
    return crepe
  })

  useEffect(() => {
    readOnlyReference.current = readOnly
    crepeReference.current?.setReadonly(readOnly)
  }, [readOnly])

  // Copy the editor's text into the form now; its own change listener waits
  // 200 ms, which loses the last words when saving or leaving right away.
  const sync = useCallback(() => {
    const crepe = crepeReference.current
    if (!crepe) return
    let markdown: string
    try {
      markdown = crepe.getMarkdown()
    } catch {
      return // not ready yet
    }
    if (markdown === appliedMarkdown.current) return
    if (markdown === ((getValues(name) as string) || '')) return
    setValue(name, markdown as PathValue<TFormValues, typeof name>, {
      shouldDirty: true,
    })
  }, [getValues, name, setValue])

  useEffect(() => {
    if (!registerSync) return
    registerSync(sync)
    return () => registerSync(null)
  }, [sync, registerSync])

  // Show changes saved elsewhere (another device or a collaborator) unless
  // the person is typing here or has unsaved changes of their own.
  useEffect(() => {
    const crepe = crepeReference.current
    if (value === undefined || !crepe) return
    try {
      const view = crepe.editor.ctx.get(editorViewCtx)
      if (view.hasFocus() || getFieldState(name).isDirty) return
      if (crepe.getMarkdown() === value) return
      appliedMarkdown.current = value
      crepe.editor.action(replaceAll(value))
    } catch {
      // The editor is not ready yet; it starts from the form value.
    }
  }, [value, getFieldState, name])

  const handleReference = useCallback(
    (element: HTMLTextAreaElement | null) => {
      ref(element)
    },
    [ref],
  )

  const handleFocus = () => {
    crepeReference.current?.editor.action((context) => {
      context.get(editorViewCtx).focus()
    })
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
