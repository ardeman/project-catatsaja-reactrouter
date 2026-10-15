import { Crepe } from '@milkdown/crepe'
import { editorViewCtx } from '@milkdown/kit/core'
import { replaceAll } from '@milkdown/kit/utils'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PathValue, useFormContext } from 'react-hook-form'

import { activeFormatsPlugin } from './active-formats'
import { codeTheme } from './code-theme'
import { FormattingMenu } from './formatting-menu.client'
import { TEditorFormat, TMilkdownEditorProperties } from './type'

import '@milkdown/crepe/theme/common/style.css'
import '~/styles/crepe.css'

export { FormattingBar } from './formatting-bar'
export type { TEditorFormat } from './type'

// Each keyed editor owns its factory and cleanup, including after creating a
// note or applying an AI edit. A page-wide provider could reuse an old factory.
export const MilkdownEditor = <TFormValues extends Record<string, unknown>>(
  properties: TMilkdownEditorProperties<TFormValues>,
) => (
  <MilkdownProvider>
    <Editor {...properties} />
  </MilkdownProvider>
)

const Editor = <TFormValues extends Record<string, unknown>>(
  properties: TMilkdownEditorProperties<TFormValues>,
) => {
  const {
    name,
    label,
    placeholder: placeholderText,
    previousName,
    readOnly = false,
    value,
    registerSync,
    registerFormat,
    onActiveFormatsChange,
  } = properties
  const { register, setValue, getValues, setFocus, getFieldState } =
    useFormContext<TFormValues>()
  const { ref } = register(name)
  const crepeReference = useRef<Crepe>(undefined)
  const editorElement = useRef<HTMLElement | null>(null)
  const readOnlyReference = useRef(readOnly)
  // Markdown this component put into the editor itself, so the change
  // listener does not report it back as an edit.
  const appliedMarkdown = useRef<string>(undefined)
  const [activeFormats, setActiveFormats] = useState<TEditorFormat[]>([])
  const activeFormatsChange = useRef(onActiveFormatsChange)
  useEffect(() => {
    activeFormatsChange.current = onActiveFormatsChange
  }, [onActiveFormatsChange])

  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: (getValues(name) as string) || '',
      features: {
        [Crepe.Feature.BlockEdit]: false,
        [Crepe.Feature.Toolbar]: false,
      },
      featureConfigs: {
        [Crepe.Feature.CodeMirror]: { theme: codeTheme },
        [Crepe.Feature.Placeholder]: {
          text: placeholderText,
          mode: 'doc',
        },
      },
    })
    crepe.editor.use(
      activeFormatsPlugin((formats) => {
        setActiveFormats(formats)
        activeFormatsChange.current?.(formats)
      }),
    )
    crepe.setReadonly(readOnlyReference.current)
    crepe.on((listener) => {
      listener.markdownUpdated((_, markdown) => {
        if (markdown === appliedMarkdown.current) return
        setValue(name, markdown as PathValue<TFormValues, typeof name>, {
          shouldDirty: true,
        })
      })
      listener.mounted((context) => {
        const view = context.get(editorViewCtx)
        const dom = view.dom
        editorElement.current = dom
        listener.destroy(() => {
          editorElement.current = null
        })
        dom.setAttribute('role', 'textbox')
        dom.setAttribute('aria-multiline', 'true')
        dom.setAttribute('aria-label', label || placeholderText || name)
        dom.setAttribute('aria-readonly', String(readOnlyReference.current))
        if (!previousName) return
        const handler = (event: KeyboardEvent) => {
          const isBackspace = event.key === 'Backspace'
          const isArrowUp = event.key === 'ArrowUp'
          const isEmpty = view.state.doc.textContent.length === 0
          const isAtStart = view.state.selection.from === 1
          const isLeaving = (isBackspace && isEmpty) || (isArrowUp && isAtStart)
          if (!isLeaving) return
          event.preventDefault()
          setFocus(previousName)
        }
        dom.addEventListener('keydown', handler as EventListener)
        listener.destroy(() => {
          dom.removeEventListener('keydown', handler as EventListener)
        })
      })
    })
    crepeReference.current = crepe
    return crepe
  })

  useEffect(() => {
    readOnlyReference.current = readOnly
    crepeReference.current?.setReadonly(readOnly)
    editorElement.current?.setAttribute('aria-readonly', String(readOnly))
  }, [readOnly])

  useEffect(() => {
    editorElement.current?.setAttribute(
      'aria-label',
      label || placeholderText || name,
    )
  }, [label, placeholderText, name])

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
    if (
      markdown === appliedMarkdown.current ||
      markdown === ((getValues(name) as string) || '')
    )
      return
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
      if (
        view.hasFocus() ||
        getFieldState(name).isDirty ||
        crepe.getMarkdown() === value
      )
        return
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
      <FormattingMenu
        readOnly={readOnly}
        registerFormat={registerFormat}
        active={activeFormats}
      >
        <Milkdown />
      </FormattingMenu>
    </>
  )
}
