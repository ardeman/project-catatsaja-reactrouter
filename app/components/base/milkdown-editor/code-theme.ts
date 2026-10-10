import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

// Code blocks in the note editor, coloured from the app's theme variables so
// they follow light and dark mode (Crepe's default is always One Dark).
// Syntax colours come from --code-* in app/styles/crepe.css.
const editorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'hsl(var(--muted))',
    color: 'hsl(var(--foreground))',
  },
  '.cm-content': { caretColor: 'hsl(var(--foreground))' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'hsl(var(--foreground))' },
  '.cm-gutters': {
    backgroundColor: 'hsl(var(--muted))',
    color: 'hsl(var(--muted-foreground))',
    border: 'none',
  },
  '.cm-activeLine': { backgroundColor: 'hsl(var(--foreground) / 0.05)' },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: 'hsl(var(--foreground))',
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    { backgroundColor: 'hsl(var(--primary) / 0.3)' },
})

const highlightStyle = HighlightStyle.define([
  {
    tag: [tags.keyword, tags.operatorKeyword, tags.modifier],
    color: 'var(--code-keyword)',
  },
  {
    tag: [tags.string, tags.special(tags.string), tags.regexp],
    color: 'var(--code-string)',
  },
  {
    tag: [tags.number, tags.bool, tags.null, tags.atom],
    color: 'var(--code-number)',
  },
  {
    tag: [tags.comment, tags.meta],
    color: 'var(--code-comment)',
    fontStyle: 'italic',
  },
  {
    tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
    color: 'var(--code-function)',
  },
  {
    tag: [tags.typeName, tags.className, tags.namespace],
    color: 'var(--code-type)',
  },
  {
    tag: [tags.propertyName, tags.attributeName],
    color: 'var(--code-property)',
  },
  {
    tag: [tags.tagName, tags.heading],
    color: 'var(--code-tag)',
    fontWeight: '600',
  },
  {
    tag: [tags.operator, tags.punctuation],
    color: 'hsl(var(--muted-foreground))',
  },
  { tag: tags.link, color: 'var(--code-string)', textDecoration: 'underline' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: '700' },
])

export const codeTheme = [editorTheme, syntaxHighlighting(highlightStyle)]
