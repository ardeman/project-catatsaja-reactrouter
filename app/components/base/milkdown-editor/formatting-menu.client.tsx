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
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '~/components/ui/popover'
import { cn } from '~/lib/utils/shadcn'

import { formats } from './formats'
import { TEditorFormat, TFormattingMenuProperties } from './type'

export const FormattingMenu = ({
  children,
  readOnly,
  active,
  registerFormat,
}: TFormattingMenuProperties) => {
  const { t } = useTranslation()
  const [, getEditor] = useInstance()
  const [open, setOpen] = useState(false)
  const [point, setPoint] = useState({ x: 0, y: 0 })
  const container = useRef<HTMLDivElement>(null)
  const openedFromPointer = useRef(false)

  useEffect(() => {
    const root = container.current
    if (!root || readOnly) return
    // Touch and hold belongs to the phone: it selects text and shows the
    // system's own copy and paste menu. Touch screens format from the
    // Format button in the page's toolbar instead.
    let wasTouch = false
    const show = (x: number, y: number) => {
      const editor = getEditor()
      if (!editor || editor.status !== EditorStatus.Created) return
      editor.action((context) => {
        const view = context.get(editorViewCtx)
        if (!view.editable) return
        const position = view.posAtCoords({ left: x, top: y })
        const { from, to } = view.state.selection
        // Keep a selection when the person opens the menu over it;
        // otherwise format at the clicked cursor position.
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
      const pointerType =
        event instanceof PointerEvent ? event.pointerType : undefined
      if (pointerType === 'touch' || (wasTouch && pointerType !== 'mouse'))
        return
      event.preventDefault()
      if (event.clientX === 0 && event.clientY === 0) {
        const editor = getEditor()
        if (!editor) return
        const view = editor.ctx.get(editorViewCtx)
        const cursor = view.coordsAtPos(view.state.selection.from)
        show(cursor.left, cursor.bottom)
      } else show(event.clientX, event.clientY)
    }
    const pointerDown = (event: PointerEvent) => {
      wasTouch = event.pointerType === 'touch'
    }
    const keyDown = () => {
      wasTouch = false
    }
    root.addEventListener('contextmenu', contextMenu)
    root.addEventListener('pointerdown', pointerDown)
    root.addEventListener('keydown', keyDown)
    return () => {
      root.removeEventListener('contextmenu', contextMenu)
      root.removeEventListener('pointerdown', pointerDown)
      root.removeEventListener('keydown', keyDown)
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

  // The formatting row in the page's toolbar formats through this.
  const formatReference = useRef(format)
  useEffect(() => {
    formatReference.current = format
  })
  useEffect(() => {
    if (!registerFormat) return
    registerFormat((value) => formatReference.current(value))
    return () => registerFormat(null)
  }, [registerFormat])

  return (
    <div ref={container}>
      <Popover
        open={!readOnly && open}
        onOpenChange={setOpen}
      >
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
                aria-pressed={active.includes(value)}
                className={cn(
                  'justify-start px-2 text-xs',
                  active.includes(value) && 'text-primary',
                )}
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
