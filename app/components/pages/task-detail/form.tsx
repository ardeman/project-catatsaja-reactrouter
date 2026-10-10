import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, ChevronUp, Trash } from 'lucide-react'
import { useRef, useState } from 'react'
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
import { useUserData } from '~/lib/hooks/use-get-user'
import { toast } from '~/lib/hooks/use-toast'
import { useUpdateTask } from '~/lib/hooks/use-update-task'
import { TTaskForm } from '~/lib/types/task'
import { getDateLabel } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'
import { taskSchema } from '~/lib/validations/task'

import { TFormProperties } from './type'

type TItem = TTaskForm['content'][number]

const inputClassName =
  'border-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 focus-visible:shadow-none focus:outline-hidden resize-none min-h-fit'

// Items as stored: empty ones are dropped.
const toStoredContent = (content: TItem[]) =>
  content
    .filter((item) => item.item.trim().length > 0)
    .map(({ checked, item }) => ({ checked, item }))

export const Form = (properties: TFormProperties) => {
  const { task } = properties
  const { t, i18n } = useTranslation()
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
  const isPinned = task?.isPinned
  const canWrite = task?.permissions?.write.includes(userData?.uid || '')
  const isOwner = task?.owner === userData?.uid
  const isEditable = isOwner || canWrite
  const isReadOnly = !!task && !isEditable
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
  const formMethods = useForm<TTaskForm>({
    resolver: zodResolver(taskSchema(t)),
    values: {
      title: selectedTask?.title || '',
      item: '',
      content: selectedTask?.content || [],
    },
    // Changes saved elsewhere must not overwrite what is being typed.
    resetOptions: { keepDirtyValues: true },
  })
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
  } = useFieldArray({
    control: control,
    name: 'content',
  })
  const watchTitle = watch('title')
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
    const reference = await mutateCreateTask({ title, content: storedContent })
    // Stays set after success: the page switches to the new item and this
    // form unmounts, which must not create it a second time.
    if (!reference) isCreating.current = false
    return reference
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    const reference = await save()
    if (reference) navigate(`/tasks/${reference.id}`, { replace: true })
  }

  useAutosave({
    save,
    watch: [watchTitle, JSON.stringify(watchContent)],
    saveWhenIdle: !!selectedTask,
  })

  const handleToggleCheckAll = () => {
    const newValue = !checkedAll
    for (const [index, item] of watchContent.entries()) {
      update(index, { ...item, checked: newValue })
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

  // Move within its own group (open or completed).
  const handleMove = (index: number, direction: -1 | 1) => {
    const group = watchContent[index].checked ? doneIndexes : openIndexes
    const target = group[group.indexOf(index) + direction]
    if (target === undefined) return
    move(index, target)
    if (selectedEdit === index) setSelectedEdit(target)
  }

  const startEditing = (index: number) => {
    setSelectedEdit(index)
    requestAnimationFrame(() => {
      setFocus(`content.${index}.item`)
    })
  }

  const focusNextOpen = (afterIndex: number) => {
    const next = openIndexes.find((index) => index > afterIndex)
    if (next === undefined) {
      setSelectedEdit(undefined)
      setFocus('item')
    } else {
      startEditing(next)
    }
  }

  const focusPreviousOpen = (beforeIndex: number) => {
    const previous = openIndexes.findLast((index) => index < beforeIndex)
    if (previous === undefined) {
      setSelectedEdit(undefined)
      setFocus('title')
    } else {
      startEditing(previous)
    }
  }

  const handleContentKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number,
  ) => {
    const item = getValues(`content.${index}.item`)
    if (event.key === 'Enter') {
      event.preventDefault()
      if (item.trim().length === 0) {
        handleRemoveItem(index)
        focusNextOpen(index - 1)
      } else {
        focusNextOpen(index)
      }
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setSelectedEdit(undefined)
    }
    if (event.key === 'Backspace' && item.length === 0) {
      event.preventDefault()
      handleRemoveItem(index)
      focusPreviousOpen(index)
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusPreviousOpen(index)
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusNextOpen(index)
    }
  }

  const handleNewItemKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      setSelectedEdit(undefined)
      if (watchItem.trim().length === 0) return
      append({ checked: false, item: watchItem.trim() })
      setValue('item', '')
      requestAnimationFrame(() => {
        setFocus('item')
      })
    }
    if (
      (event.key === 'Backspace' && watchItem.length === 0) ||
      event.key === 'ArrowUp'
    ) {
      event.preventDefault()
      focusPreviousOpen(watchContent.length)
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
    if (lines.length > 1) {
      event.preventDefault()
      setSelectedEdit(undefined)
      for (const line of lines) {
        append({ checked: false, item: line })
      }
      setValue('item', '')
      requestAnimationFrame(() => {
        setFocus('item')
      })
    }
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
        className="group/item flex min-h-8 items-start gap-2"
      >
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
            <div className="flex min-w-0 flex-1 items-start gap-2">
              {isEditing ? (
                <Textarea
                  name={`content.${index}.item`}
                  containerClassName="flex-1"
                  className="w-full"
                  inputClassName={inputClassName}
                  rows={1}
                  aria-label={t('tasks.form.item.label')}
                  onKeyDown={(event) => handleContentKeyDown(event, index)}
                />
              ) : (
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => startEditing(index)}
                  className={cn(
                    'min-w-0 flex-1 cursor-text text-left text-sm wrap-break-word whitespace-pre-wrap disabled:cursor-default',
                    item.checked && 'text-muted-foreground line-through',
                  )}
                >
                  {item.item}
                </button>
              )}
              {!isReadOnly && (
                <div
                  className={cn(
                    'flex items-center gap-1',
                    !isEditing &&
                      'hidden sm:flex sm:opacity-0 sm:group-focus-within/item:opacity-100 sm:group-hover/item:opacity-100',
                  )}
                >
                  {isEditing && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 sm:size-6 [&_svg]:size-3.5"
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
                        className="size-8 sm:size-6 [&_svg]:size-3.5"
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
                    className="size-8 text-destructive sm:size-6 [&_svg]:size-3.5"
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
              handleShare={() => handleShareTask({ task })}
              handleUnlink={() => handleUnlinkTask({ task })}
              sharedCount={sharedCount}
              handleBack={handleBackTask}
              handleToggleCheckAll={
                isReadOnly ? undefined : handleToggleCheckAll
              }
              checkedAll={checkedAll}
            />
          ) : (
            <Action
              className="w-full"
              buttonClassName="glass-surface"
              isLoading={isCreatePending}
              isCreate={true}
              handleBack={handleBackTask}
              disabled={!isDirty}
              handleToggleCheckAll={handleToggleCheckAll}
              checkedAll={checkedAll}
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
            if (event.key === 'Enter' || event.key === 'ArrowDown') {
              event.preventDefault()
              setFocus('item')
            }
          }}
          onFocus={() => setSelectedEdit(undefined)}
          readOnly={isReadOnly}
        />
        <div className="space-y-1">
          {openIndexes.map((index) => renderItem(index))}
        </div>
        <Textarea
          name="item"
          placeholder={t('tasks.form.placeholder.label')}
          containerClassName={cn('flex-1', isReadOnly && 'hidden')}
          inputClassName={inputClassName}
          rows={1}
          readOnly={isReadOnly}
          onKeyDown={handleNewItemKeyDown}
          onPaste={handleNewItemPaste}
          onFocus={() => setSelectedEdit(undefined)}
          leftNode={({ className }) => (
            <div
              className={cn(
                className,
                'relative left-0 mr-2 size-4 rounded-full border border-dashed border-primary opacity-50',
              )}
            />
          )}
        />
        {doneIndexes.length > 0 && (
          <section className="space-y-1 border-t pt-4">
            <h2 className="text-xs font-medium text-muted-foreground">
              {t('tasks.completed', {
                count: doneIndexes.length,
                total: watchContent.length,
              })}
            </h2>
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
