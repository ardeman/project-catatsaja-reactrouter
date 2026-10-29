import { zodResolver } from '@hookform/resolvers/zod'
import {
  Check,
  ChevronDown,
  ChevronUp,
  ListIndentDecrease,
  ListIndentIncrease,
  ListPlus,
  Plus,
  Trash,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Action } from '~/components/base/action'
import { CardStyleLayer } from '~/components/base/card-style'
import { Checkbox } from '~/components/base/checkbox'
import { SaveStatus, TSaveStatus } from '~/components/base/save-status'
import { Textarea } from '~/components/base/textarea'
import { useTask } from '~/components/pages/tasks'
import { Button } from '~/components/ui/button'
import { ToastAction } from '~/components/ui/toast'
import { auth } from '~/lib/configs/firebase'
import { useAutosave } from '~/lib/hooks/use-autosave'
import { useCreateTask } from '~/lib/hooks/use-create-task'
import { useDocumentTitle } from '~/lib/hooks/use-document-title'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useStoredValues } from '~/lib/hooks/use-stored-values'
import { toast } from '~/lib/hooks/use-toast'
import { useUndoHistory } from '~/lib/hooks/use-undo-history'
import { useUpdateArchive } from '~/lib/hooks/use-update-archive'
import { useUpdateCardStyle } from '~/lib/hooks/use-update-card-style'
import { useUpdateTask } from '~/lib/hooks/use-update-task'
import { TTaskForm, TTaskItem } from '~/lib/types/task'
import { toCardStyle } from '~/lib/utils/card-style'
import { getDateLabel } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'
import {
  TArrangement,
  canIndentItem,
  getBlocks,
  getSections,
  getSiblings,
  indentItem,
  isSubtask,
  moveItem,
  outdentItem,
  settleItems,
  toggleItem,
} from '~/lib/utils/task-items'
import { taskSchema } from '~/lib/validations/task'

import { AiHelpers } from './ai-helpers'
import { getClickedCaret } from './click-caret.client'
import { ReorderHandle } from './reorder-handle'
import { TDragPreview, TFormProperties, TTaskList } from './type'

type TItem = TTaskItem

const inputClassName =
  'border-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-0 py-1 focus-visible:shadow-none focus:outline-hidden resize-none min-h-7'

// Items as stored: empty ones are dropped, and `level` is kept only on
// subtasks.
const toStoredContent = (content: TItem[]) =>
  content
    .filter((item) => item.item.trim().length > 0)
    .map(({ checked, item, level }, index) =>
      level === 1 && index > 0 ? { checked, item, level } : { checked, item },
    )

// Keep native navigation inside wrapped text; cross items only from the
// first or last visual line, preserving the character column.
const getBoundaryLineColumn = (
  input: HTMLTextAreaElement,
  direction: -1 | 1 = 1,
) => {
  const caret = input.selectionEnd
  if (input.selectionStart !== caret) return
  const mirror = document.createElement('div')
  const style = getComputedStyle(input)
  for (const property of [
    'font',
    'letter-spacing',
    'line-height',
    'padding',
    'border',
    'box-sizing',
    'word-break',
    'overflow-wrap',
  ])
    mirror.style.setProperty(property, style.getPropertyValue(property))
  Object.assign(mirror.style, {
    position: 'fixed',
    visibility: 'hidden',
    whiteSpace: 'pre-wrap',
    width: `${input.getBoundingClientRect().width}px`,
    top: '0',
    left: '0',
  })
  const before = document.createTextNode('')
  const marker = document.createElement('span')
  marker.textContent = '\u{200B}'
  const after = document.createTextNode('')
  mirror.append(before, marker, after)
  document.body.append(mirror)
  const topAt = (position: number) => {
    before.textContent = input.value.slice(0, position)
    after.textContent = input.value.slice(position)
    return marker.getBoundingClientRect().top
  }
  try {
    const boundaryTop = topAt(direction === -1 ? 0 : input.value.length)
    if (Math.abs(topAt(caret) - boundaryTop) > 1) return
    let start = 0
    let end = caret
    while (start < end) {
      const middle = Math.floor((start + end) / 2)
      if (topAt(middle) < boundaryTop - 1) start = middle + 1
      else end = middle
    }
    return caret - start
  } finally {
    mirror.remove()
  }
}

export const Form = (properties: TFormProperties) => {
  const { task } = properties
  const { t, i18n } = useTranslation()
  const { mutate: archive } = useUpdateArchive()
  const { mutate: updateCardStyle } = useUpdateCardStyle()
  const {
    selectedTask,
    handleDeleteTask,
    handleShareTask,
    handleUnlinkTask,
    handleBackTask,
  } = useTask()
  const dateLabel = task
    ? getDateLabel({
        updatedAt: task.updatedAt?.seconds,
        createdAt: task.createdAt.seconds,
        t,
        locale: i18n.language,
      })
    : ''
  const { data: userData } = useUserData()
  const [selectedEdit, setSelectedEdit] = useState<number>()
  const [dragPreview, setDragPreview] = useState<TDragPreview>()
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const formElement = useRef<HTMLFormElement>(null)
  const pointerCaret = useRef<{ fieldId: string; caret: number }>(undefined)
  const canWrite = task?.permissions?.write.includes(userData?.uid || '')
  const isOwner = task?.owner === userData?.uid
  const isEditable = isOwner || canWrite
  const isReadOnly = isCreatingTask || (!!task && !isEditable)
  const sharedCount = new Set(
    [
      ...(task?.permissions?.read || []),
      ...(task?.permissions?.write || []),
    ].filter((uid) => uid !== auth?.currentUser?.uid),
  ).size
  const { mutate: mutateCreateTask, isPending: isCreatePending } =
    useCreateTask()
  const navigate = useNavigate()
  const { mutate: mutateUpdateTask } = useUpdateTask()
  const storedValues: TTaskForm = {
    title: selectedTask?.title || '',
    item: '',
    content: selectedTask?.content || [],
  }
  const formMethods = useForm<TTaskForm>({
    resolver: zodResolver(taskSchema(t)),
    defaultValues: storedValues,
  })
  useStoredValues({ form: formMethods, stored: storedValues })
  const {
    getValues,
    formState: { isDirty },
    setFocus,
    control,
    setValue,
  } = formMethods
  const {
    fields: fieldsContent,
    remove,
    update,
    move,
    insert,
    append,
    replace,
  } = useFieldArray({
    control,
    name: 'content',
  })
  const watchTitle = useWatch({ control, name: 'title' })
  useDocumentTitle(watchTitle || t('navigation.tasks'))
  const watchItem = useWatch({ control, name: 'item' })
  const watchContent = useWatch({ control, name: 'content' })
  const isCreating = useRef(false)
  const [saveStatus, setSaveStatus] = useState<TSaveStatus>('idle')

  // Open items first, then the completed ones, each with its subtasks;
  // indexes stay those of the stored list.
  const { open: openIndexes, done: doneIndexes } = getSections(watchContent)

  const checkedAll =
    watchContent.length > 0
      ? watchContent.every((item) => item.checked === true)
      : undefined

  // Writes only what differs from the stored task, so it is safe to call at
  // any time (autosave, leaving the page, the Save button).
  const save = async () => {
    if (isReadOnly) return
    addPendingItems(false)
    const { title, content } = getValues()
    const storedContent = toStoredContent(content)
    if (selectedTask) {
      const changes: { title?: string; content?: TItem[] } = {}
      if (title !== (selectedTask.title || '')) changes.title = title
      if (
        JSON.stringify(storedContent) !==
        JSON.stringify(toStoredContent(selectedTask.content || []))
      )
        changes.content = storedContent
      if (Object.keys(changes).length === 0) return
      setSaveStatus('saving')
      const isSaved = await mutateUpdateTask({
        id: selectedTask.id,
        ...changes,
      })
      setSaveStatus(isSaved ? 'saved' : 'error')
      return
    }
    if (isCreating.current || (!title && storedContent.length === 0)) return
    isCreating.current = true
    // Keep the old creation form locked until navigation finishes, so text
    // cannot be entered into a form whose cleanup is about to run.
    setIsCreatingTask(true)
    const reference = await mutateCreateTask({ title, content: storedContent })
    // Stays set after success: the page switches to the new item and this
    // form unmounts, which must not create it a second time.
    if (!reference) {
      isCreating.current = false
      setIsCreatingTask(false)
    }
    return reference
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    const reference = await save()
    if (reference) navigate(`/tasks/${reference.id}`, { replace: true })
  }

  useAutosave({
    save,
    // The add field stays unfinished during idle saves, but is included
    // when leaving or pressing Save.
    watch: [watchTitle, JSON.stringify(watchContent), watchItem],
    saveWhenIdle: !!selectedTask && !watchItem.trim(),
  })

  // Undo and redo over the title and items together, in steps (a pause in
  // changes).
  const current = useMemo(
    () => ({ title: watchTitle, content: toStoredContent(watchContent) }),
    [watchTitle, watchContent],
  )
  const stored = useMemo(
    () => ({
      title: selectedTask?.title || '',
      content: toStoredContent(selectedTask?.content || []),
    }),
    [selectedTask?.title, selectedTask?.content],
  )
  const history = useUndoHistory({
    key: selectedTask?.id ?? 'create',
    value: current,
    stored,
  })
  const restore = (next?: typeof current) => {
    if (!next) return
    setSelectedEdit(undefined)
    setValue('title', next.title, { shouldDirty: true })
    replace(next.content)
  }
  const historyActions = isReadOnly
    ? {}
    : {
        handleUndo: () => restore(history.undo()),
        handleRedo: () => restore(history.redo()),
        canUndo: history.canUndo,
        canRedo: history.canRedo,
      }

  // The list as on screen, with what is still in the add field.
  const getList = (): TTaskList => {
    addPendingItems(false)
    const { title, content } = getValues()
    return { title, content: toStoredContent(content) }
  }

  // An AI helper's list, after the person accepted the preview: a step of
  // its own, undone from the bar.
  const handleApply = (next: TTaskList) => {
    history.checkpoint(getList())
    restore(next)
    toast({ description: t('tasks.ai.applied') })
  }

  const aiMenu = isReadOnly
    ? undefined
    : (buttonClassName: string) => (
        <AiHelpers
          getList={getList}
          hasOpenItems={openIndexes.length > 0}
          hasItems={watchContent.length > 0}
          onApply={handleApply}
          triggerClassName={buttonClassName}
        />
      )

  const handleToggleCheckAll = () => {
    const shouldCheck = !checkedAll
    for (const [index, item] of watchContent.entries()) {
      update(index, { ...item, checked: shouldCheck })
    }
  }

  // Applies a change from `~/lib/utils/task-items`: rows are moved, so they
  // keep their state, and only what changed is set. Returns where an item
  // went.
  const arrange = (arrangement?: TArrangement) => {
    if (!arrangement) return
    const positions = getValues('content').map((_, index) => index)
    for (const [to, from] of arrangement.order.entries()) {
      const at = positions.indexOf(from)
      if (at === to) continue
      move(at, to)
      positions.splice(to, 0, ...positions.splice(at, 1))
    }
    for (const [index, next] of arrangement.content.entries()) {
      const item = getValues(`content.${index}`)
      if (item.checked !== next.checked)
        setValue(`content.${index}.checked`, next.checked, {
          shouldDirty: true,
        })
      if (item.level !== next.level)
        setValue(`content.${index}.level`, next.level, { shouldDirty: true })
    }
    return (index: number) => arrangement.order.indexOf(index)
  }

  // An item goes with its subtasks, unless they are kept (an emptied item
  // removed from the keyboard): they then become items of their own.
  const handleRemoveItem = (index: number, shouldKeepSubtasks = false) => {
    const content = getValues('content')
    const block = isSubtask(content, index)
      ? [index]
      : (getBlocks(content).find((block) => block[0] === index) ?? [index])
    if (shouldKeepSubtasks)
      for (const at of block.slice(1))
        setValue(`content.${at}.level`, undefined, { shouldDirty: true })
    const removed = shouldKeepSubtasks ? [index] : block
    const items = removed.map((at) => content[at])
    setSelectedEdit(undefined)
    remove(removed)
    arrange(settleItems(getValues('content')))
    if (items.every((item) => item.item.trim().length === 0)) return
    toast({
      description: t('toast.itemDeleted', { item: items[0].item }),
      action: (
        <ToastAction
          altText={t('form.undo')}
          onClick={() => {
            setSelectedEdit(undefined)
            insert(Math.min(index, getValues('content').length), items)
            arrange(settleItems(getValues('content')))
          }}
        >
          {t('form.undo')}
        </ToastAction>
      ),
    })
  }

  const handleDeleteCompleted = () => {
    const deleted = doneIndexes.map((index) => ({
      index,
      item: getValues(`content.${index}`),
    }))
    setSelectedEdit(undefined)
    remove(doneIndexes)
    toast({
      description: t('tasks.form.completedDeleted', {
        count: doneIndexes.length,
      }),
      action: (
        <ToastAction
          altText={t('form.undo')}
          onClick={() => {
            setSelectedEdit(undefined)
            for (const { index, item } of deleted)
              insert(Math.min(index, getValues('content').length), item)
          }}
        >
          {t('form.undo')}
        </ToastAction>
      ),
    })
  }

  const handleDrop = (index: number, target: number) => {
    setSelectedEdit(undefined)
    arrange(moveItem(getValues('content'), index, target))
  }

  // A completed item (with its subtasks) goes to the top of the completed
  // ones, a reopened one to the bottom of the open ones.
  const handleToggleItem = (index: number, isChecked: boolean) => {
    if (selectedEdit !== undefined) setSelectedEdit(undefined)
    arrange(toggleItem(getValues('content'), index, isChecked))
  }

  // Move among its siblings: the items of its section, or the other
  // subtasks of its item.
  const handleMove = (index: number, direction: -1 | 1) => {
    const siblings = getSiblings(getValues('content'), index)
    const target = siblings[siblings.indexOf(index) + direction]
    if (target === undefined) return
    const placeOf = arrange(moveItem(getValues('content'), index, target))
    if (placeOf && selectedEdit === index) setSelectedEdit(placeOf(index))
  }

  // Indenting makes an item a subtask of the one above it; outdenting
  // makes a subtask an item of its own. Editing continues where it went.
  const handleIndent = (index: number, isIndenting: boolean) => {
    const content = getValues('content')
    const placeOf = arrange(
      isIndenting ? indentItem(content, index) : outdentItem(content, index),
    )
    if (!placeOf) return false
    const place = placeOf(index)
    if (selectedEdit === index) {
      const input = formElement.current?.elements.namedItem(
        `content.${index}.item`,
      )
      startEditing(
        place,
        input instanceof HTMLTextAreaElement ? input.selectionStart : undefined,
      )
    }
    return true
  }

  // A new subtask goes after the item's last one.
  const handleAddSubtask = (index: number) => {
    const content = getValues('content')
    const block = getBlocks(content).find((block) => block[0] === index)
    if (!block) return
    const at = (block.at(-1) ?? index) + 1
    flushSync(() =>
      insert(
        at,
        { checked: false, item: '', level: 1 },
        { shouldFocus: false },
      ),
    )
    const placeOf = arrange(settleItems(getValues('content')))
    startEditing(placeOf ? placeOf(at) : at)
  }

  const focusItem = (
    name: 'title' | 'item' | `content.${number}.item`,
    caret?: number,
    shouldUseLastLine = false,
  ) => {
    const input = formElement.current?.elements.namedItem(name)
    if (!(input instanceof HTMLTextAreaElement)) return
    input.focus()
    if (caret === undefined) return
    let position = Math.min(caret, input.value.length)
    if (shouldUseLastLine) {
      input.setSelectionRange(input.value.length, input.value.length)
      const lineLength = getBoundaryLineColumn(input) ?? input.value.length
      position = input.value.length - lineLength + Math.min(caret, lineLength)
    }
    input.setSelectionRange(position, position)
  }

  const startEditing = (
    index: number,
    caret?: number,
    shouldUseLastLine = false,
  ) => {
    // Mount and focus within the tap's event, while mobile keyboard focus
    // is still allowed, rather than waiting for an animation frame.
    flushSync(() => setSelectedEdit(index))
    focusItem(`content.${index}.item`, caret, shouldUseLastLine)
  }

  const focusNextOpen = (afterIndex: number, column?: number) => {
    const next = openIndexes.find((index) => index > afterIndex)
    if (next === undefined) {
      setSelectedEdit(undefined)
      focusItem(
        'item',
        column === undefined
          ? undefined
          : Math.min(column, getValues('item').split('\n', 1)[0].length),
      )
    } else {
      startEditing(
        next,
        column === undefined
          ? undefined
          : Math.min(
              column,
              getValues(`content.${next}.item`).split('\n', 1)[0].length,
            ),
      )
    }
  }

  const focusPreviousOpen = (
    beforeIndex: number,
    shouldFocusEnd = false,
    column?: number,
  ) => {
    const previous = openIndexes.findLast((index) => index < beforeIndex)
    if (previous === undefined) {
      setSelectedEdit(undefined)
      if (column === undefined) setFocus('title')
      else focusItem('title', column, true)
    } else {
      startEditing(
        previous,
        shouldFocusEnd ? getValues(`content.${previous}.item`).length : column,
        column !== undefined,
      )
    }
  }

  const handleContentKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number,
  ) => {
    const item = getValues(`content.${index}.item`)
    const content = getValues('content')
    const isSubitem = isSubtask(content, index)
    switch (event.key) {
      case 'Enter': {
        if (event.shiftKey || event.nativeEvent.isComposing) return
        event.preventDefault()
        // An empty subtask becomes an item of its own, as in other lists.
        if (isSubitem && item.trim().length === 0) {
          handleIndent(index, false)
        } else if (item.trim().length === 0) {
          handleRemoveItem(index, true)
          focusNextOpen(index - 1)
        } else if (getValues(`content.${index}.checked`)) {
          focusNextOpen(index)
        } else {
          // Split at the caret: the text after it becomes a new item below,
          // a subtask when it lands among subtasks.
          const { selectionStart, selectionEnd } = event.currentTarget
          const isNextSubtask = isSubitem || isSubtask(content, index + 1)
          setValue(`content.${index}.item`, item.slice(0, selectionStart), {
            shouldDirty: true,
          })
          flushSync(() =>
            insert(
              index + 1,
              {
                checked: false,
                item: item.slice(selectionEnd),
                ...(isNextSubtask && { level: 1 as const }),
              },
              { shouldFocus: false },
            ),
          )
          startEditing(index + 1, 0)
        }
        break
      }
      case 'Tab': {
        if (event.nativeEvent.isComposing) return
        // Only when it changes something, so Tab still leaves the field.
        const isIndenting = !event.shiftKey
        if (isIndenting ? !canIndentItem(content, index) : !isSubitem) return
        event.preventDefault()
        handleIndent(index, isIndenting)
        break
      }
      case 'Escape': {
        event.preventDefault()
        setSelectedEdit(undefined)
        break
      }
      case 'Backspace': {
        if (item.length > 0) break
        event.preventDefault()
        if (isSubitem) {
          handleIndent(index, false)
          break
        }
        handleRemoveItem(index, true)
        // Removing an item shifts the indexes after it, but not the previous one.
        focusPreviousOpen(index, true)
        break
      }
      case 'ArrowUp': {
        const column = getBoundaryLineColumn(event.currentTarget, -1)
        if (column === undefined) return
        event.preventDefault()
        focusPreviousOpen(index, false, column)
        break
      }
      case 'ArrowDown': {
        const column = getBoundaryLineColumn(event.currentTarget)
        if (column === undefined) return
        event.preventDefault()
        focusNextOpen(index, column)
        break
      }
    }
  }

  const addPendingItems = (shouldFocus = true) => {
    const items = getValues('item')
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => ({ checked: false, item }))
    if (items.length === 0) return
    setSelectedEdit(undefined)
    append(items, { shouldFocus: false })
    setValue('item', '')
    if (shouldFocus) requestAnimationFrame(() => setFocus('item'))
  }

  const handleNewItemKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === 'Enter') {
      if (event.shiftKey || event.nativeEvent.isComposing) return
      event.preventDefault()
      addPendingItems()
      return
    }
    if (event.key === 'Backspace' && watchItem.length === 0) {
      event.preventDefault()
      focusPreviousOpen(watchContent.length, true)
    } else if (event.key === 'ArrowUp') {
      const column = getBoundaryLineColumn(event.currentTarget, -1)
      if (column === undefined) return
      event.preventDefault()
      focusPreviousOpen(watchContent.length, false, column)
    }
  }

  const handleNewItemPaste = (
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => {
    const lines = event.clipboardData
      .getData('text')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    if (lines.length <= 1) {
      return
    }

    event.preventDefault()
    setSelectedEdit(undefined)
    for (const line of lines) {
      append({ checked: false, item: line })
    }
    requestAnimationFrame(() => {
      setFocus('item')
    })
  }

  const blocks = getBlocks(watchContent)
  // Where a dragged row would land: after an item with subtasks is after
  // its last one.
  const drop =
    dragPreview && dragPreview.source !== dragPreview.target
      ? dragPreview.source < dragPreview.target
        ? {
            index:
              blocks.find((block) => block[0] === dragPreview.target)?.at(-1) ??
              dragPreview.target,
            side: 'after' as const,
          }
        : { index: dragPreview.target, side: 'before' as const }
      : undefined

  const renderItem = (index: number) => {
    const field = fieldsContent[index]
    const item = watchContent[index]
    if (!field || !item) return null
    const isEditing = selectedEdit === index
    const isSubitem = isSubtask(watchContent, index)
    const siblings = getSiblings(watchContent, index)
    const position = siblings.indexOf(index)
    // Rows a drag can land on: the items of a section, or the subtasks of
    // one item.
    const group = isSubitem
      ? `subtasks-${blocks.find((block) => block.includes(index))?.[0]}`
      : item.checked
        ? 'done'
        : 'open'
    const isDragging = dragPreview?.source === index
    const dropSide = drop?.index === index ? drop.side : undefined

    return (
      <div
        key={field.id}
        data-task-index={index}
        data-task-checked={item.checked}
        data-task-group={group}
        data-task-subtask={isSubitem || undefined}
        data-task-dragging={isDragging || undefined}
        data-task-drop={dropSide}
        className={cn(
          'relative flex min-h-10 items-center gap-2 rounded-md sm:min-h-8',
          isSubitem && 'ml-7 sm:ml-8',
          isEditing && 'items-start sm:items-center',
          isDragging && 'bg-primary/5 opacity-50',
          dropSide && 'bg-primary/5',
        )}
      >
        {dropSide && (
          <span
            aria-hidden="true"
            data-task-drop-marker
            className={cn(
              'pointer-events-none absolute inset-x-0 z-10 h-0.5 rounded-full bg-primary before:absolute before:-top-0.5 before:left-0 before:size-1.5 before:rounded-full before:bg-primary',
              dropSide === 'before' ? '-top-0.5' : '-bottom-0.5',
            )}
          />
        )}
        {!isReadOnly && (
          <ReorderHandle
            index={index}
            group={group}
            onMove={(target) => handleDrop(index, target)}
            onPreview={setDragPreview}
          />
        )}
        <Checkbox
          name={`content.${index}.checked`}
          className="m-0 w-full"
          containerClassName={cn(
            'items-center',
            isEditing && 'items-start sm:items-center',
          )}
          inputClassName={isEditing ? 'mt-3.5 sm:mt-0' : undefined}
          aria-label={item.item}
          disabled={isReadOnly}
          onChange={(checked) => handleToggleItem(index, checked === true)}
          rightNode={
            <div
              className={cn(
                'flex min-w-0 flex-1 items-center gap-2',
                isEditing && 'flex-col items-start sm:flex-row sm:items-center',
              )}
            >
              {isEditing ? (
                <Textarea
                  name={`content.${index}.item`}
                  className="mt-1.5 w-full min-w-0 flex-1 sm:mt-0"
                  inputClassName={inputClassName}
                  rows={1}
                  aria-label={t('tasks.form.item.label')}
                  onKeyDown={(event) => handleContentKeyDown(event, index)}
                />
              ) : (
                <button
                  type="button"
                  disabled={isReadOnly}
                  onPointerDown={(event) => {
                    if (!event.isPrimary) return
                    pointerCaret.current = {
                      fieldId: field.id,
                      caret: getClickedCaret(
                        event.currentTarget,
                        event.clientX,
                        event.clientY,
                      ),
                    }
                  }}
                  onPointerCancel={() => {
                    pointerCaret.current = undefined
                  }}
                  onKeyDown={() => {
                    pointerCaret.current = undefined
                  }}
                  onClick={(event) => {
                    const tappedCaret = pointerCaret.current
                    pointerCaret.current = undefined
                    startEditing(
                      index,
                      tappedCaret?.fieldId === field.id
                        ? tappedCaret.caret
                        : event.detail === 0
                          ? undefined
                          : getClickedCaret(
                              event.currentTarget,
                              event.clientX,
                              event.clientY,
                            ),
                    )
                  }}
                  className={cn(
                    'min-w-0 flex-1 cursor-text py-1 text-left text-sm wrap-break-word whitespace-pre-wrap disabled:cursor-default',
                    item.checked && 'text-muted-foreground line-through',
                  )}
                >
                  {item.item}
                </button>
              )}
              {!isReadOnly && isEditing && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11 sm:size-8 [&_svg]:size-3.5"
                    type="button"
                    aria-label={t(
                      isSubitem ? 'tasks.form.outdent' : 'tasks.form.indent',
                    )}
                    title={t(
                      isSubitem ? 'tasks.form.outdent' : 'tasks.form.indent',
                    )}
                    disabled={!isSubitem && !canIndentItem(watchContent, index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleIndent(index, !isSubitem)}
                  >
                    {isSubitem ? (
                      <ListIndentDecrease />
                    ) : (
                      <ListIndentIncrease />
                    )}
                  </Button>
                  {!isSubitem && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-11 sm:size-8 [&_svg]:size-3.5"
                      type="button"
                      aria-label={t('tasks.form.addSubtask')}
                      title={t('tasks.form.addSubtask')}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleAddSubtask(index)}
                    >
                      <ListPlus />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11 sm:size-8 [&_svg]:size-3.5"
                    type="button"
                    aria-label={t('actions.moveUp')}
                    title={t('actions.moveUp')}
                    disabled={position <= 0}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleMove(index, -1)}
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11 sm:size-8 [&_svg]:size-3.5"
                    type="button"
                    aria-label={t('actions.moveDown')}
                    title={t('actions.moveDown')}
                    disabled={position === siblings.length - 1}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleMove(index, 1)}
                  >
                    <ChevronDown />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11 sm:size-8 [&_svg]:size-3.5"
                    type="button"
                    aria-label={t('tasks.form.doneEditing')}
                    title={t('tasks.form.doneEditing')}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setSelectedEdit(undefined)}
                  >
                    <Check />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11 text-destructive sm:size-8 [&_svg]:size-3.5"
                    type="button"
                    aria-label={t('actions.deleteItem')}
                    title={t('actions.deleteItem')}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleRemoveItem(index)}
                  >
                    <Trash />
                  </Button>
                </div>
              )}
            </div>
          }
        />
      </div>
    )
  }

  return (
    <FormProvider {...formMethods}>
      <form
        ref={formElement}
        onSubmit={handleCreate}
        className="group/form is-shown mx-auto w-full max-w-6xl space-y-4"
      >
        <CardStyleLayer
          isPage
          cardStyle={toCardStyle(task?.cardStyle)}
        />
        <div className="sticky top-[calc(1rem+var(--top-inset))] z-40 flex justify-center md:top-24">
          {task ? (
            <Action
              className="w-full"
              buttonClassName="glass-surface"
              isOwner={isOwner}
              isEditable={isEditable}
              handleDelete={() => handleDeleteTask({ task })}
              isArchived={task.isArchived}
              handleArchive={() => archive('tasks', task.id, !task.isArchived)}
              handleShare={() => handleShareTask({ task })}
              handleUnlink={() => handleUnlinkTask({ task })}
              sharedCount={sharedCount}
              cardStyle={toCardStyle(task.cardStyle)}
              handleCardStyle={(next) =>
                updateCardStyle('tasks', task.id, next)
              }
              handleBack={handleBackTask}
              handleToggleCheckAll={
                isReadOnly ? undefined : handleToggleCheckAll
              }
              checkedAll={checkedAll}
              extra={aiMenu}
              {...historyActions}
            />
          ) : (
            <Action
              className="w-full"
              buttonClassName="glass-surface"
              isLoading={isCreatePending || isCreatingTask}
              isCreate={true}
              handleBack={handleBackTask}
              disabled={!isDirty}
              handleToggleCheckAll={
                isReadOnly ? undefined : handleToggleCheckAll
              }
              checkedAll={checkedAll}
              extra={aiMenu}
              {...historyActions}
            />
          )}
        </div>
        <Textarea
          name="title"
          placeholder={t('tasks.form.title.label')}
          inputClassName="border-none ring-0 text-xl md:text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 focus-visible:shadow-none focus:outline-hidden resize-none min-h-0"
          autoFocus={!task} // eslint-disable-line jsx-a11y/no-autofocus -- new lists only; `task` is set from the first render
          rows={1}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== 'ArrowDown') {
              return
            }

            event.preventDefault()
            setFocus('item')
          }}
          onFocus={() => setSelectedEdit(undefined)}
          readOnly={isReadOnly}
        />
        <div className="space-y-1">
          {watchContent.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t('tasks.progress', {
                done: watchContent.filter((item) => item.checked).length,
                total: watchContent.length,
              })}
            </p>
          )}
          {!isReadOnly && (
            <p className="pb-2 text-xs text-muted-foreground">
              {t('tasks.form.editHint')}
            </p>
          )}
          {openIndexes.map((index) => renderItem(index))}
        </div>
        {!isReadOnly && (
          <div className="pl-15 sm:pl-16">
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <Textarea
                name="item"
                aria-label={t('tasks.form.placeholder.label')}
                placeholder={t('tasks.form.placeholder.label')}
                className="w-full min-w-0 sm:flex-1"
                inputClassName={inputClassName}
                rows={1}
                readOnly={isReadOnly}
                onKeyDown={handleNewItemKeyDown}
                onPaste={handleNewItemPaste}
                onFocus={() => setSelectedEdit(undefined)}
              />
              <Button
                type="button"
                className="min-h-11 self-end sm:self-auto"
                disabled={!watchItem.trim()}
                onClick={() => addPendingItems()}
              >
                <Plus />
                {t('tasks.form.addItem')}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('tasks.form.addHint')}
            </p>
          </div>
        )}
        {doneIndexes.length > 0 && (
          <section className="space-y-1 border-t pt-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-medium text-muted-foreground">
                {t('tasks.completed', {
                  count: doneIndexes.length,
                  total: watchContent.length,
                })}
              </h2>
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteCompleted}
                >
                  <Trash />
                  {t('tasks.form.deleteCompleted')}
                </Button>
              )}
            </div>
            {doneIndexes.map((index) => renderItem(index))}
          </section>
        )}
      </form>
      <span className="flex justify-center gap-2 text-xs text-muted-foreground">
        <span>
          {dateLabel}{' '}
          {task &&
            (isEditable
              ? !isOwner && `(${t('form.permissions.shared')})`
              : `(${t('form.permissions.readOnly')})`)}
        </span>
        <SaveStatus status={saveStatus} />
      </span>
    </FormProvider>
  )
}
