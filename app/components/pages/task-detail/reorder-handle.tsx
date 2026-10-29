import { GripVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils/shadcn'

import { TDragPreview } from './type'

type TProperties = {
  index: number
  // Rows sharing it are the ones it can be dropped on.
  group: string
  onMove: (target: number) => void
  onPreview: (preview?: TDragPreview) => void
}

export const ReorderHandle = ({
  index,
  group,
  onMove,
  onPreview,
}: TProperties) => {
  const { t } = useTranslation()
  const [active, setActive] = useState(false)
  const gesture = useRef<{
    timer: ReturnType<typeof setTimeout>
    x: number
    y: number
    ready: boolean
    target: number
  }>(undefined)
  const cancel = () => {
    clearTimeout(gesture.current?.timer)
    gesture.current = undefined
    setActive(false)
    onPreview()
  }
  useEffect(
    () => () => {
      clearTimeout(gesture.current?.timer)
      if (gesture.current?.ready) onPreview()
    },
    [onPreview],
  )

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t('tasks.form.arrange')}
      title={t('tasks.form.arrange')}
      className={cn(
        'h-10 w-7 shrink-0 touch-none text-muted-foreground select-none sm:size-8',
        active ? 'cursor-grabbing ring-2 ring-primary' : 'cursor-grab',
      )}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        gesture.current = {
          x: event.clientX,
          y: event.clientY,
          ready: false,
          target: index,
          timer: setTimeout(() => {
            if (!gesture.current) return
            gesture.current.ready = true
            setActive(true)
            onPreview({ source: index, target: index })
          }, 350),
        }
      }}
      onPointerMove={(event) => {
        const current = gesture.current
        if (!current) return
        if (!current.ready) {
          if (
            Math.hypot(event.clientX - current.x, event.clientY - current.y) > 8
          )
            cancel()
          return
        }
        const row = document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLElement>('[data-task-index]')
        if (row?.dataset.taskGroup !== group) return
        const target = Number(row.dataset.taskIndex)
        if (target === current.target) return
        current.target = target
        onPreview({ source: index, target })
      }}
      onPointerUp={() => {
        const current = gesture.current
        const target = current?.ready ? current.target : index
        cancel()
        if (target !== undefined && target !== index) onMove(target)
      }}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
    >
      <GripVertical />
    </Button>
  )
}
