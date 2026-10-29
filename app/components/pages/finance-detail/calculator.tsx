import { Copy, Delete, X } from 'lucide-react'
import {
  Dispatch,
  PointerEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { useUserData } from '~/lib/hooks/use-get-user'
import { toast } from '~/lib/hooks/use-toast'
import { evaluateExpression } from '~/lib/utils/math-expression'
import { getDefaultCurrencyFormat } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'

type TProperties = {
  // The calculation, with "." decimals and + - * / (as math-expression
  // reads it).
  expression: string
  setExpression: Dispatch<SetStateAction<string | undefined>>
  className?: string
}

const OPERATORS = new Set(['+', '-', '*', '/'])
const SYMBOLS: Record<string, string> = { '*': '×', '/': '÷', '-': '−' }

// Adds a key to the calculation: an operator replaces one just typed, and
// a second decimal mark in a number is ignored.
const appendKey = (expression: string, key: string) => {
  const last = expression.at(-1) ?? ''
  if (OPERATORS.has(key)) {
    if (!expression) return key === '-' ? key : expression
    return OPERATORS.has(last)
      ? `${expression.slice(0, -1)}${key}`
      : `${expression}${key}`
  }
  if (key === '.') {
    const number = /[\d.]*$/.exec(expression)?.[0] ?? ''
    if (number.includes('.')) return expression
    return `${expression}${number ? '' : '0'}.`
  }
  return `${expression}${key}`
}

// Keeps a box moved by (x, y) inside the window, a small margin from its
// edges.
const clampOffset = (rect: DOMRect, x: number, y: number) => {
  const margin = 8
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), Math.max(min, max))
  return {
    x: clamp(x, margin - rect.left, innerWidth - margin - rect.right),
    y: clamp(y, margin - rect.top, innerHeight - margin - rect.bottom),
  }
}

// A floating calculator for quick sums beside a book's entries. It stays
// open while scrolling, takes the sum of selected entries, and can be
// dragged by its header anywhere on the screen.
export const Calculator = ({
  expression,
  setExpression,
  className,
}: TProperties) => {
  const { t } = useTranslation()
  const { data: userData } = useUserData()
  const { thousandSeparator, decimalSeparator } =
    userData?.currencyFormat ?? getDefaultCurrencyFormat()
  // After "=", a digit starts a new calculation and an operator goes on
  // from the result.
  const isResult = useRef(false)
  const panel = useRef<HTMLElement>(null)
  // How far it was dragged from where it opens.
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; rect: DOMRect }>(undefined)

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!panel.current || (event.target as HTMLElement).closest('button'))
      return
    event.currentTarget.setPointerCapture(event.pointerId)
    const box = panel.current.getBoundingClientRect()
    drag.current = {
      x: event.clientX - offset.x,
      y: event.clientY - offset.y,
      // Where it would be without the offset, so moves are measured
      // from there.
      rect: new DOMRect(
        box.x - offset.x,
        box.y - offset.y,
        box.width,
        box.height,
      ),
    }
  }
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const { x, y, rect } = drag.current
    setOffset(clampOffset(rect, event.clientX - x, event.clientY - y))
  }
  const endDrag = () => {
    drag.current = undefined
  }

  // A window of a new width (turning a phone) puts it back where it
  // opens, which is always in view. Height alone changes when a phone's
  // address bar hides while scrolling.
  useEffect(() => {
    let width: number | undefined
    const observer = new ResizeObserver(([entry]) => {
      const next = entry.contentRect.width
      if (width !== undefined && next !== width) setOffset({ x: 0, y: 0 })
      width = next
    })
    observer.observe(document.documentElement)
    return () => observer.disconnect()
  }, [])

  const format = (text: string) =>
    text.replaceAll(/\d+(?:\.\d*)?/g, (number) => {
      const [integer, fraction] = number.split('.', 2)
      const grouped = integer.replaceAll(
        /\B(?=(\d{3})+(?!\d))/g,
        () => thousandSeparator,
      )
      return fraction === undefined
        ? grouped
        : `${grouped}${decimalSeparator}${fraction}`
    })
  const shown = (text: string) =>
    format(text).replaceAll(/[*/-]/g, (operator) => SYMBOLS[operator])

  const result = expression ? evaluateExpression(expression) : undefined
  const resultText = result === undefined ? '' : format(String(result))

  const press = useCallback(
    (key: string) => {
      const wasResult = isResult.current
      isResult.current = false
      setExpression((current = '') => {
        if (key === 'clear') return ''
        if (key === 'back') return current.slice(0, -1)
        if (key === '=') {
          const value = evaluateExpression(current)
          if (value === undefined) return current
          isResult.current = true
          return String(value)
        }
        const start = wasResult && /[\d.(]/.test(key) ? '' : current
        return appendKey(start, key)
      })
    },
    [setExpression],
  )

  // Typing works too while nothing else has the keyboard.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        target?.closest('input, textarea, select, [contenteditable="true"]')
      )
        return
      const keys: Record<string, string> = {
        Enter: '=',
        Backspace: 'back',
        Delete: 'clear',
        x: '*',
        ',': '.',
      }
      const key = keys[event.key] ?? event.key
      if (key === 'Escape') {
        setExpression(undefined)
        return
      }
      if (key !== 'back' && key !== 'clear' && !/^[\d.+\-*/()=]$/.test(key))
        return
      event.preventDefault()
      press(key)
    }
    addEventListener('keydown', handleKey)
    return () => removeEventListener('keydown', handleKey)
  }, [press, setExpression])

  const copy = async () => {
    if (!resultText) return
    try {
      await navigator.clipboard.writeText(resultText)
      toast({ description: t('finances.calculator.copied') })
    } catch {
      toast({ variant: 'destructive', description: t('errors.unknown') })
    }
  }

  const keys: { key: string; label: string; aria?: string }[] = [
    { key: 'clear', label: 'C', aria: t('finances.calculator.clear') },
    { key: '(', label: '(' },
    { key: ')', label: ')' },
    { key: '/', label: '÷' },
    { key: '7', label: '7' },
    { key: '8', label: '8' },
    { key: '9', label: '9' },
    { key: '*', label: '×' },
    { key: '4', label: '4' },
    { key: '5', label: '5' },
    { key: '6', label: '6' },
    { key: '-', label: '−' },
    { key: '1', label: '1' },
    { key: '2', label: '2' },
    { key: '3', label: '3' },
    { key: '+', label: '+' },
    { key: '0', label: '0' },
    { key: '.', label: decimalSeparator },
    { key: 'back', label: '', aria: t('finances.calculator.back') },
    { key: '=', label: '=' },
  ]

  return (
    <section
      ref={panel}
      aria-label={t('finances.calculator.label')}
      style={{ translate: `${offset.x}px ${offset.y}px` }}
      className={cn(
        'glass-surface glass-float motion-fade grid w-64 gap-2 rounded-xl border p-3 shadow-lg',
        className,
      )}
    >
      <div
        className="-m-1 flex cursor-grab touch-none items-center justify-between gap-2 rounded-lg p-1 select-none active:cursor-grabbing"
        title={t('finances.calculator.move')}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <h2 className="text-sm font-medium">
          {t('finances.calculator.label')}
        </h2>
        <div className="flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={!resultText}
            aria-label={t('finances.calculator.copy')}
            title={t('finances.calculator.copy')}
            onClick={copy}
          >
            <Copy className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={t('finances.calculator.close')}
            title={t('finances.calculator.close')}
            onClick={() => setExpression(undefined)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <output
        aria-live="polite"
        className="grid min-h-14 rounded-lg bg-muted/50 px-3 py-2 text-right tabular-nums"
      >
        <span className="text-xs break-all text-muted-foreground">
          {shown(expression) || '0'}
        </span>
        <span className="text-lg font-semibold break-all">
          {resultText || (expression ? '…' : '0')}
        </span>
      </output>
      <div className="grid grid-cols-4 gap-1">
        {keys.map(({ key, label, aria }) => (
          <Button
            key={key}
            type="button"
            variant={
              key === '='
                ? 'default'
                : OPERATORS.has(key)
                  ? 'secondary'
                  : 'ghost'
            }
            className="h-10 text-base tabular-nums"
            aria-label={aria}
            title={aria}
            onClick={() => press(key)}
          >
            {key === 'back' ? <Delete className="size-4" /> : label}
          </Button>
        ))}
      </div>
    </section>
  )
}
