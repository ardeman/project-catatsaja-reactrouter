import { zodResolver } from '@hookform/resolvers/zod'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Action } from '~/components/base/action'
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
import { useUpdateTask } from '~/lib/hooks/use-update-task'
import { TTaskForm } from '~/lib/types/task'
import { getDateLabel } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'
import { taskSchema } from '~/lib/validations/task'

import { ReorderHandle } from './reorder-handle'
import { TFormProperties } from './type'

type TItem = TTaskForm['content'][number]

const inputClassName =
  'border-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-0 py-1 focus-visible:shadow-none focus:outline-hidden resize-none min-h-8'

// Items as stored: empty ones are dropped.
const toStoredContent = (content: TItem[]) =>
  content
    .filter((item) => item.item.trim().length > 0)
    .map(({ checked, item }) => ({ checked, item }))

// Let the browser move down inside wrapped text. Only the last visual line
// continues to the next item, keeping its character column.
const getLastLineColumn = (input: HTMLTextAreaElement) => {
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
    const lastTop = topAt(input.value.length)
    if (topAt(caret) < lastTop - 1) return
    let start = 0
    let end = caret
    while (start < end) {
      const middle = Math.floor((start + end) / 2)
      if (topAt(middle) < lastTop - 1) start = middle + 1
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
  const {
    selectedTask,
    handleDeleteTask,
    handlePinTask,
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
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const formElement = useRef<HTMLFormElement>(null)
  const isPinned = task?.isPinned
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
    watch,
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
    control: control,
    name: 'content',
  })
  const watchTitle = watch('title')
  useDocumentTitle(watchTitle || t('navigation.tasks'))
  const watchItem = watch('item')
  const watchContent = watch('content')
  const isCreating = useRef(false)
  const [saveStatus, setSaveStatus] = useState<TSaveStatus>('idle')

  // Unchecked items first, then the completed ones; indexes stay those of
  // the stored list.
  const indexes = watchContent.map((_, index) => index)
  const openIndexes = indexes.filter((index) => !watchContent[index].checked)
  const doneIndexes = indexes.filter((index) => watchContent[index].checked)

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

  const handleToggleCheckAll = () => {
    const shouldCheck = !checkedAll
    for (const [index, item] of watchContent.entries()) {
      update(index, { ...item, checked: shouldCheck })
    }
  }

  const handleRemoveItem = (index: number) => {
    const item = getValues(`content.${index}`)
    setSelectedEdit(undefined)
    remove(index)
    toast({
      description: t('toast.itemDeleted', { item: item.item }),
      action: (
        <ToastAction
          altText={t('form.undo')}
          onClick={() => insert(index, item)}
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

  const moveItem = (index: number, target: number) => {
    move(index, target)
    setSelectedEdit(undefined)
  }

  // Move within its own group (open or completed).
  const handleMove = (index: number, direction: -1 | 1) => {
    const group = watchContent[index].checked ? doneIndexes : openIndexes
    const target = group[group.indexOf(index) + direction]
    if (target === undefined) return
    move(index, target)
    if (selectedEdit === index) setSelectedEdit(target)
  }

  const focusItem = (
    name: 'item' | `content.${number}.item`,
    caret?: number,
  ) => {
    requestAnimationFrame(() => {
      const input = formElement.current?.elements.namedItem(name)
      if (!(input instanceof HTMLTextAreaElement)) return
      input.focus()
      if (caret === undefined) return
      const position = Math.min(caret, input.value.length)
      input.setSelectionRange(position, position)
    })
  }

  const startEditing = (index: number, caret?: number) => {
    setSelectedEdit(index)
    focusItem(`content.${index}.item`, caret)
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

  const focusPreviousOpen = (beforeIndex: number, shouldFocusEnd = false) => {
    const previous = openIndexes.findLast((index) => index < beforeIndex)
    if (previous === undefined) {
      setSelectedEdit(undefined)
      setFocus('title')
    } else {
      startEditing(
        previous,
        shouldFocusEnd
          ? getValues(`content.${previous}.item`).length
          : undefined,
      )
    }
  }

  const handleContentKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number,
  ) => {
    const item = getValues(`content.${index}.item`)
    switch (event.key) {
      case 'Enter': {
        if (event.shiftKey || event.nativeEvent.isComposing) return
        event.preventDefault()
        if (item.trim().length === 0) {
          handleRemoveItem(index)
          focusNextOpen(index - 1)
        } else {
          focusNextOpen(index)
        }
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
        handleRemoveItem(index)
        // Removing an item shifts the indexes after it, but not the previous one.
        focusPreviousOpen(index, true)
        break
      }
      case 'ArrowUp': {
        if (event.currentTarget.selectionStart !== 0) return
        event.preventDefault()
        focusPreviousOpen(index)
        break
      }
      case 'ArrowDown': {
        const column = getLastLineColumn(event.currentTarget)
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
    const isBackOut =
      (event.key === 'Backspace' && watchItem.length === 0) ||
      event.key === 'ArrowUp'
    if (!isBackOut || event.currentTarget.selectionStart !== 0) return
    event.preventDefault()
    focusPreviousOpen(watchContent.length, event.key === 'Backspace')
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

  const renderItem = (index: number) => {
    const field = fieldsContent[index]
    const item = watchContent[index]
    if (!field || !item) return null
    const isEditing = selectedEdit === index
    const group = item.checked ? doneIndexes : openIndexes
    const position = group.indexOf(index)

    return (
      <div
        key={field.id}
        data-task-index={index}
        data-task-checked={item.checked}
        className="group/item flex min-h-11 items-start gap-2"
      >
        {!isReadOnly && (
          <ReorderHandle
            index={index}
            checked={item.checked}
            onMove={(target) => moveItem(index, target)}
          />
        )}
        <Checkbox
          name={`content.${index}.checked`}
          className="m-0 w-full"
          containerClassName="items-start"
          inputClassName="mt-1"
          aria-label={item.item}
          disabled={isReadOnly}
          onChange={(checked) => {
            update(index, { ...item, checked: checked === true })
            if (isEditing) setSelectedEdit(undefined)
          }}
          rightNode={
            <div
              className={cn(
                'flex min-w-0 flex-1 items-start gap-2',
                isEditing && 'flex-col sm:flex-row',
              )}
            >
              {isEditing ? (
                <Textarea
                  name={`content.${index}.item`}
                  className="w-full min-w-0 flex-1"
                  inputClassName={inputClassName}
                  rows={1}
                  aria-label={t('tasks.form.item.label')}
                  onKeyDown={(event) => handleContentKeyDown(event, index)}
                />
              ) : (
                <span
                  className={cn(
                    'min-h-8 min-w-0 flex-1 py-1 text-left text-sm wrap-break-word whitespace-pre-wrap',
                    item.checked && 'text-muted-foreground line-through',
                  )}
                >
                  {item.item}
                </span>
              )}
              {!isReadOnly && (
                <div
                  className={cn(
                    'flex items-center gap-1',
                    !isEditing &&
                      'sm:opacity-0 sm:group-focus-within/item:opacity-100 sm:group-hover/item:opacity-100',
                  )}
                >
                  {isEditing && (
                    <>
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
                        disabled={position === group.length - 1}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleMove(index, 1)}
                      >
                        <ChevronDown />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11 sm:size-8 [&_svg]:size-3.5"
                    type="button"
                    aria-label={t(
                      isEditing
                        ? 'tasks.form.doneEditing'
                        : 'tasks.form.editItem',
                    )}
                    title={t(
                      isEditing
                        ? 'tasks.form.doneEditing'
                        : 'tasks.form.editItem',
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() =>
                      isEditing
                        ? setSelectedEdit(undefined)
                        : startEditing(index)
                    }
                  >
                    {isEditing ? <Check /> : <Pencil />}
                  </Button>
                  {isEditing && (
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
                  )}
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
        <div className="sticky top-20 z-40 flex justify-center md:top-24">
          {task ? (
            <Action
              className="w-full"
              buttonClassName="glass-surface"
              isOwner={isOwner}
              isEditable={isEditable}
              isPinned={isPinned}
              handleDelete={() => handleDeleteTask({ task })}
              handlePin={() => handlePinTask({ task, isPinned: !isPinned })}
              isArchived={task.isArchived}
              handleArchive={() => archive('tasks', task.id, !task.isArchived)}
              handleShare={() => handleShareTask({ task })}
              handleUnlink={() => handleUnlinkTask({ task })}
              sharedCount={sharedCount}
              handleBack={handleBackTask}
              handleToggleCheckAll={
                isReadOnly ? undefined : handleToggleCheckAll
              }
              checkedAll={checkedAll}
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
                done: doneIndexes.length,
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
          <div>
            <div className="flex items-start gap-2">
              <Textarea
                name="item"
                aria-label={t('tasks.form.placeholder.label')}
                placeholder={t('tasks.form.placeholder.label')}
                className="min-w-0 flex-1"
                inputClassName={inputClassName}
                rows={1}
                readOnly={isReadOnly}
                onKeyDown={handleNewItemKeyDown}
                onPaste={handleNewItemPaste}
                onFocus={() => setSelectedEdit(undefined)}
              />
              <Button
                type="button"
                className="min-h-11"
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
