import { toggleLinkCommand } from '@milkdown/kit/component/link-tooltip'
import { commandsCtx, editorViewCtx, EditorStatus } from '@milkdown/kit/core'
import {
  bulletListSchema,
  inlineCodeSchema,
  toggleInlineCodeCommand,
  liftListItemCommand,
  orderedListSchema,
  toggleEmphasisCommand,
  toggleStrongCommand,
  turnIntoTextCommand,
  wrapInBulletListCommand,
  wrapInHeadingCommand,
  wrapInOrderedListCommand,
} from '@milkdown/kit/preset/commonmark'
import { toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm'
import { TextSelection } from '@milkdown/kit/prose/state'
import { useInstance } from '@milkdown/react'
import {
  Bold,
  ChevronDown,
  Code,
  Link,
  Sigma,
  Strikethrough,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Type,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'

import { TEditorFormat, TFormattingMenuProperties } from './type'

const formats = [
  { value: 'bold', icon: Bold },
  { value: 'italic', icon: Italic },
  { value: 'code', icon: Code },
  { value: 'strikethrough', icon: Strikethrough },
  { value: 'link', icon: Link },
  { value: 'formula', icon: Sigma },
  { value: 'heading', icon: Heading1 },
  { value: 'subheading', icon: Heading2 },
  { value: 'bullets', icon: List },
  { value: 'numbers', icon: ListOrdered },
  { value: 'text', icon: Type },
] as const

export const FormattingMenu = ({
  children,
  readOnly,
}: TFormattingMenuProperties) => {
  const { t } = useTranslation()
  const [loading, getEditor] = useInstance()
  const [open, setOpen] = useState(false)
  const [point, setPoint] = useState({ x: 0, y: 0 })
  const container = useRef<HTMLDivElement>(null)
  const openedFromPointer = useRef(false)

  useEffect(() => {
    const root = container.current
    if (!root || readOnly) return
    let timer: ReturnType<typeof setTimeout> | undefined
    let start: { x: number; y: number; pointerId: number } | undefined
    const cancel = () => {
      clearTimeout(timer)
      start = undefined
    }
    const show = (x: number, y: number) => {
      const editor = getEditor()
      if (!editor || editor.status !== EditorStatus.Created) return
      editor.action((context) => {
        const view = context.get(editorViewCtx)
        if (!view.editable) return
        const position = view.posAtCoords({ left: x, top: y })
        const { from, to } = view.state.selection
        // Keep a selection when the person opens the menu over it;
        // otherwise format at the clicked or touched cursor position.
        if (position && (position.pos < from || position.pos > to)) {
          const resolved = view.state.doc.resolve(position.pos)
          const selection = TextSelection.near(resolved)
          view.dispatch(view.state.tr.setSelection(selection))
        }
        view.focus()
        openedFromPointer.current = true
        setPoint({ x, y })
        setOpen(true)
      })
    }
    const isEditor = (target: EventTarget | null) => {
      const editor = getEditor()
      return (
        target instanceof Node &&
        editor?.status === EditorStatus.Created &&
        editor.ctx.get(editorViewCtx).dom.contains(target)
      )
    }
    const contextMenu = (event: MouseEvent) => {
      if (!isEditor(event.target)) return
      event.preventDefault()
      cancel()
      if (event.clientX === 0 && event.clientY === 0) {
        const editor = getEditor()
        if (!editor) return
        const view = editor.ctx.get(editorViewCtx)
        const cursor = view.coordsAtPos(view.state.selection.from)
        show(cursor.left, cursor.bottom)
      } else show(event.clientX, event.clientY)
    }
    const pointerDown = (event: PointerEvent) => {
      cancel()
      if (
        event.pointerType !== 'touch' ||
        !event.isPrimary ||
        !isEditor(event.target)
      )
        return
      start = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
      timer = setTimeout(() => {
        show(event.clientX, event.clientY)
        cancel()
      }, 550)
    }
    const pointerMove = (event: PointerEvent) => {
      if (
        start &&
        (event.pointerId !== start.pointerId ||
          Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10)
      )
        cancel()
    }
    root.addEventListener('contextmenu', contextMenu)
    root.addEventListener('pointerdown', pointerDown)
    root.addEventListener('pointermove', pointerMove)
    root.addEventListener('pointerup', cancel)
    root.addEventListener('pointercancel', cancel)
    return () => {
      cancel()
      root.removeEventListener('contextmenu', contextMenu)
      root.removeEventListener('pointerdown', pointerDown)
      root.removeEventListener('pointermove', pointerMove)
      root.removeEventListener('pointerup', cancel)
      root.removeEventListener('pointercancel', cancel)
    }
  }, [getEditor, readOnly])

  const format = (value: TEditorFormat) => {
    const editor = getEditor()
    if (readOnly || !editor || editor.status !== EditorStatus.Created) return
    editor.action((context) => {
      const view = context.get(editorViewCtx)
      if (!view.editable) return
      const commands = context.get(commandsCtx)
      switch (value) {
        case 'bold': {
          commands.call(toggleStrongCommand.key)
          break
        }
        case 'italic': {
          commands.call(toggleEmphasisCommand.key)
          break
        }
        case 'code': {
          const { state } = view
          if (state.selection.empty) {
            const mark = inlineCodeSchema.type(context)
            const active = mark.isInSet(
              state.storedMarks ?? state.selection.$from.marks(),
            )
            view.dispatch(
              active
                ? state.tr.removeStoredMark(mark)
                : state.tr.addStoredMark(mark.create()),
            )
          } else commands.call(toggleInlineCodeCommand.key)
          break
        }
        case 'strikethrough': {
          commands.call(toggleStrikethroughCommand.key)
          break
        }
        case 'link': {
          commands.call(toggleLinkCommand.key)
          break
        }
        case 'formula': {
          // The enabled Crepe Latex feature registers this named command.
          commands.call('ToggleLatex')
          break
        }
        case 'heading': {
          commands.call(wrapInHeadingCommand.key, 1)
          break
        }
        case 'subheading': {
          commands.call(wrapInHeadingCommand.key, 2)
          break
        }
        default: {
          // Leave an existing list before switching its kind or returning
          // to normal text. Choosing the same list again removes it.
          const { $from } = view.state.selection
          let previousList: 'bullets' | 'numbers' | undefined
          for (let depth = $from.depth; depth > 0; depth--) {
            const type = $from.node(depth).type
            if (type === bulletListSchema.type(context))
              previousList = 'bullets'
            if (type === orderedListSchema.type(context))
              previousList = 'numbers'
            if (previousList) break
          }
          if (previousList) commands.call(liftListItemCommand.key)
          if (value === 'text') commands.call(turnIntoTextCommand.key)
          else if (value !== previousList)
            commands.call(
              value === 'bullets'
                ? wrapInBulletListCommand.key
                : wrapInOrderedListCommand.key,
            )
        }
      }
      view.focus()
    })
    setOpen(false)
  }

  return (
    <div ref={container}>
      <Popover
        open={!readOnly && open}
        onOpenChange={setOpen}
      >
        {!readOnly && (
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mb-3 gap-1.5 text-muted-foreground"
              disabled={loading}
              title={t('notes.formatting.toggle')}
              onClick={(event) => {
                openedFromPointer.current = false
                const bounds = event.currentTarget.getBoundingClientRect()
                setPoint({ x: bounds.left, y: bounds.bottom })
              }}
            >
              <Type aria-hidden="true" />
              {t('notes.formatting.toggle')}
              <ChevronDown aria-hidden="true" />
            </Button>
          </PopoverTrigger>
        )}
        <PopoverAnchor asChild>
          <span
            aria-hidden="true"
            className="pointer-events-none fixed size-0"
            style={{ left: point.x, top: point.y }}
          />
        </PopoverAnchor>
        <PopoverContent
          aria-label={t('notes.formatting.title')}
          align="start"
          collisionPadding={12}
          className="w-72 max-w-[calc(100vw-1.5rem)] p-2"
          onOpenAutoFocus={(event) => {
            // A touch release must not refocus the editor from a menu
            // button and dismiss the popup before an option is chosen.
            if (openedFromPointer.current) event.preventDefault()
          }}
          onEscapeKeyDown={(event) => {
            event.preventDefault()
            setOpen(false)
            getEditor()?.action((context) => context.get(editorViewCtx).focus())
          }}
          onCloseAutoFocus={(event) => {
            // Formatting and Escape restore the editor focus themselves.
            event.preventDefault()
          }}
        >
          <div
            role="group"
            aria-label={t('notes.formatting.title')}
            className="grid grid-cols-2 gap-1"
          >
            {formats.map(({ value, icon: Icon }) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                className="justify-start px-2 text-xs"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => format(value)}
              >
                <Icon aria-hidden="true" />
                {t(`notes.formatting.${value}`)}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {children}
    </div>
  )
}
