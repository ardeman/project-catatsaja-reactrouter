import { EditorState, NodeSelection, Plugin } from '@milkdown/kit/prose/state'
import { $prose } from '@milkdown/kit/utils'

import { TEditorFormat } from './type'

const markFormats = [
  ['bold', 'strong'],
  ['italic', 'emphasis'],
  ['code', 'inlineCode'],
  ['strikethrough', 'strike_through'],
  ['link', 'link'],
] as const

// The formats at the cursor or across the whole selection, so the toolbar
// can show which ones are on.
const getActiveFormats = (state: EditorState) => {
  const { selection, schema, doc } = state
  const { $from, from, to, empty } = selection
  const active: TEditorFormat[] = []
  const marks = state.storedMarks ?? $from.marks()
  for (const [format, name] of markFormats) {
    const type = schema.marks[name]
    if (!type) continue
    const isOn = empty
      ? !!type.isInSet(marks)
      : doc.rangeHasMark(from, to, type)
    if (isOn) active.push(format)
  }
  let hasFormula =
    selection instanceof NodeSelection &&
    selection.node.type.name === 'math_inline'
  if (!empty && !hasFormula)
    doc.nodesBetween(from, to, (node) => {
      if (node.type.name === 'math_inline') hasFormula = true
      return !hasFormula
    })
  if (hasFormula) active.push('formula')
  const parent = $from.parent
  if (parent.type.name === 'heading')
    active.push(parent.attrs.level === 1 ? 'heading' : 'subheading')
  let list: TEditorFormat | undefined
  for (let depth = $from.depth; !list && depth > 0; depth--) {
    const name = $from.node(depth).type.name
    if (name === 'bullet_list') list = 'bullets'
    else if (name === 'ordered_list') list = 'numbers'
  }
  if (list) active.push(list)
  else if (parent.type.name === 'paragraph') active.push('text')
  return active
}

// Reports the active formats whenever they change.
export const activeFormatsPlugin = (
  onChange: (formats: TEditorFormat[]) => void,
) =>
  $prose(
    () =>
      new Plugin({
        view: (editorView) => {
          let previous = ''
          const update = (state: EditorState) => {
            const formats = getActiveFormats(state)
            const key = formats.join(',')
            if (key === previous) return
            previous = key
            onChange(formats)
          }
          update(editorView.state)
          return {
            update: (view) => update(view.state),
            destroy: () => onChange([]),
          }
        },
      }),
  )
