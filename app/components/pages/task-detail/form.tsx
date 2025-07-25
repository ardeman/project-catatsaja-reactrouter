import { zodResolver } from '@hookform/resolvers/zod'
import { Edit, Trash, ChevronUp, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Action } from '~/components/base/action'
import { Checkbox } from '~/components/base/checkbox'
import { Textarea } from '~/components/base/textarea'
import { useTask } from '~/components/pages/tasks'
import { Button } from '~/components/ui/button'
import { ToastAction } from '~/components/ui/toast'
import { auth } from '~/lib/configs/firebase'
import { useCreateTask } from '~/lib/hooks/use-create-task'
import { useDebounce } from '~/lib/hooks/use-debounce'
import { useUserData } from '~/lib/hooks/use-get-user'
import { toast } from '~/lib/hooks/use-toast'
import { useUpdateTask } from '~/lib/hooks/use-update-task'
import { TTaskForm } from '~/lib/types/task'
import { getDateLabel } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'
import { taskSchema } from '~/lib/validations/task'

import { TFormProperties } from './type'

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
  })
  const {
    handleSubmit,
    watch,
    formState: { isDirty },
    setFocus,
    control,
    setValue,
  } = formMethods
  const {
    fields: fieldsContent,
    append,
    remove,
    update,
    move,
    insert,
  } = useFieldArray({
    control: control,
    name: 'content',
  })
  const watchTitle = watch('title')
  const watchItem = watch('item')
  const watchContent = watch('content')

  const checkedAll =
    watchContent.length > 0
      ? watchContent.every((item) => item.checked === true)
      : undefined

  const handleToggleCheckAll = () => {
    const newValue = !checkedAll
    for (const [index, field] of fieldsContent.entries()) {
      update(index, {
        ...field,
        checked: newValue,
      })
    }
  }

  const handleRemoveItem = (index: number) => {
    const item = watchContent[index]
    remove(index)
    toast({
      description: t('tasks.toast.itemDeleted', { item: item.item }),
      action: (
        <ToastAction
          altText="Undo"
          onClick={() => insert(index, item)}
        >
          {t('form.undo')}
        </ToastAction>
      ),
    })
  }

  const onSubmit = handleSubmit(async (data) => {
    const { item: _item, ...payload } = data
    if (
      (payload.title.length === 0 && payload.content.length === 0) ||
      !isDirty
    ) {
      return
    }
    if (selectedTask) {
      mutateUpdateTask({ id: selectedTask.id, ...payload })
      return
    }
    const reference = await mutateCreateTask(payload)
    if (reference) {
      navigate(`/tasks/${reference.id}`)
    }
  })

  useDebounce({
    trigger: () => onSubmit(),
    watch: [watchTitle, fieldsContent],
    condition: !!selectedTask,
  })

  const focusNextUnchecked = (start: number) => {
    const nextIndex = fieldsContent
      .map((field, index) => ({ field, index }))
      .slice(start)
      .find(({ field }) => field.checked === false)?.index

    if (nextIndex === undefined) {
      setSelectedEdit(undefined)
      setFocus('item')
    } else {
      setSelectedEdit(nextIndex)
      requestAnimationFrame(() => {
        setFocus(`content.${nextIndex}.item`)
      })
    }
  }

  const focusPreviousUnchecked = (start: number) => {
    const previousIndex = [...fieldsContent]
      .slice(0, start)
      .map((field, index) => ({ field, index }))
      .reverse()
      .find(({ field }) => field.checked === false)?.index

    if (previousIndex === undefined) {
      setSelectedEdit(undefined)
      setFocus('title')
    } else {
      setSelectedEdit(previousIndex)
      requestAnimationFrame(() => {
        setFocus(`content.${previousIndex}.item`)
      })
    }
  }

  const handleContentKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number,
    field: TTaskForm['content'][number],
  ) => {
    const isEnter = event.key === 'Enter'
    const isBackspace = event.key === 'Backspace'
    const isArrowUp = event.key === 'ArrowUp'
    const isArrowDown = event.key === 'ArrowDown'
    const item = watchContent[index].item
    if (isEnter) {
      event.preventDefault()
      setSelectedEdit(undefined)
      const isRemoving = item.length === 0
      if (isRemoving) {
        handleRemoveItem(index)
      } else {
        update(index, {
          ...field,
          item: item,
        })
      }
      focusNextUnchecked(isRemoving ? index : index + 1)
    }
    if (isBackspace && item.length === 0) {
      event.preventDefault()
      handleRemoveItem(index)
      focusPreviousUnchecked(index)
    }
    if (isArrowUp) {
      event.preventDefault()
      focusPreviousUnchecked(index)
    }
    if (isArrowDown) {
      event.preventDefault()
      focusNextUnchecked(index + 1)
    }
  }

  const handleNewItemKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    const isEnter = event.key === 'Enter'
    const isBackspace = event.key === 'Backspace'
    const isArrowUp = event.key === 'ArrowUp'
    if (isEnter) {
      event.preventDefault()
      setSelectedEdit(undefined)
      if (watchItem.length === 0) return
      append({
        checked: false,
        item: watchItem,
      })
      setValue('item', '')
      requestAnimationFrame(() => {
        setFocus('item')
      })
    }
    if (isBackspace && watchItem.length === 0) {
      event.preventDefault()
      focusPreviousUnchecked(fieldsContent.length)
    }
    if (isArrowUp) {
      event.preventDefault()
      focusPreviousUnchecked(fieldsContent.length)
    }
  }

  const handleNewItemPaste = (
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => {
    const text = event.clipboardData.getData('text')
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    if (lines.length > 1) {
      event.preventDefault()
      setSelectedEdit(undefined)
      for (const line of lines) {
        append({
          checked: false,
          item: line,
        })
      }
      setValue('item', '')
      requestAnimationFrame(() => {
        setFocus('item')
      })
    }
  }

  return (
    <FormProvider {...formMethods}>
      <form
        onSubmit={onSubmit}
        className="group/form is-shown mx-auto w-full max-w-6xl space-y-4"
      >
        <div className="sticky top-20 z-50 flex justify-center md:top-24">
          {task ? (
            <Action
              className="w-full"
              buttonClassName="supports-[backdrop-filter]:bg-accent/20 backdrop-blur"
              isOwner={isOwner}
              isEditable={isEditable}
              isPinned={isPinned}
              handleDelete={() => handleDeleteTask({ task })}
              handlePin={() => handlePinTask({ task, isPinned: !isPinned })}
              handleShare={() => handleShareTask({ task })}
              handleUnlink={() => handleUnlinkTask({ task })}
              sharedCount={sharedCount}
              handleBack={() => handleBackTask()}
              handleToggleCheckAll={handleToggleCheckAll}
              checkedAll={checkedAll}
            />
          ) : (
            <Action
              className="w-full"
              buttonClassName="supports-[backdrop-filter]:bg-accent/20 backdrop-blur"
              isLoading={isCreatePending}
              isCreate={true}
              handleBack={() => handleBackTask()}
              disabled={!isDirty}
              handleToggleCheckAll={handleToggleCheckAll}
              checkedAll={checkedAll}
            />
          )}
        </div>
        <Textarea
          name="title"
          placeholder={t('tasks.form.title.label')}
          inputClassName="border-none ring-0 text-xl md:text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 focus-visible:shadow-none focus:outline-none resize-none min-h-0"
          autoFocus={!selectedTask} // eslint-disable-line jsx-a11y/no-autofocus
          rows={1}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'ArrowDown') {
              event.preventDefault()
              setFocus('item')
            }
          }}
          onFocus={() => setSelectedEdit(undefined)}
          readOnly={task && !isEditable}
        />
        {fieldsContent.map((field, index) => (
          <div
            key={field.id}
            className="flex items-start gap-2"
          >
            <Checkbox
              name={`content.${index}.checked`}
              className="m-0 w-full"
              onChange={(checked) => {
                update(index, {
                  ...field,
                  checked: checked as boolean,
                })
              }}
              label={
                selectedEdit === index ? (
                  ''
                ) : (
                  <span
                    className={cn(
                      field.checked ? 'italic line-through opacity-50' : '',
                    )}
                  >
                    {field.item}
                  </span>
                )
              }
              rightNode={
                <>
                  {(!task || isEditable) && (
                    <>
                      <Textarea
                        name={`content.${index}.item`}
                        placeholder={field.item}
                        className={selectedEdit === index ? 'w-full' : ''}
                        containerClassName={cn(
                          'flex-1',
                          selectedEdit === index ? '' : 'hidden',
                        )}
                        inputClassName="border-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 focus-visible:shadow-none focus:outline-none resize-none min-h-fit"
                        rows={1}
                        readOnly={task && !isEditable}
                        onKeyDown={(event) =>
                          handleContentKeyDown(event, index, field)
                        }
                      />

                      <div className="flex items-center gap-x-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            'h-5 w-8 [&_svg]:size-3',
                            selectedEdit === index ? 'hidden' : '',
                          )}
                          disabled={field.checked === true}
                          type="button"
                          onClick={() => {
                            setSelectedEdit(index)
                            requestAnimationFrame(() => {
                              setFocus(`content.${index}.item`)
                            })
                          }}
                        >
                          <Edit />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            'h-5 w-8 [&_svg]:size-3 [&_svg]:text-destructive',
                            selectedEdit === index ? 'hidden' : '',
                          )}
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            'h-5 w-8 [&_svg]:size-3',
                            selectedEdit === index ? 'hidden' : '',
                          )}
                          type="button"
                          disabled={index === 0}
                          onClick={() => move(index, index - 1)}
                        >
                          <ChevronUp />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            'h-5 w-8 [&_svg]:size-3',
                            selectedEdit === index ? 'hidden' : '',
                          )}
                          type="button"
                          disabled={index === fieldsContent.length - 1}
                          onClick={() => move(index, index + 1)}
                        >
                          <ChevronDown />
                        </Button>
                      </div>
                    </>
                  )}

                  <input
                    type="hidden"
                    name={`content.${index}.item`}
                    value={field.item}
                  />
                </>
              }
            />
          </div>
        ))}
        <Textarea
          name={`item`}
          placeholder={t('tasks.form.placeholder.label')}
          containerClassName={cn('flex-1', task && !isEditable ? 'hidden' : '')}
          inputClassName="border-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 focus-visible:shadow-none focus:outline-none resize-none min-h-fit"
          rows={1}
          readOnly={task && !isEditable}
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
        <div className="text-xs opacity-50">
          (
          <span className="text-primary">
            {fieldsContent.filter((item) => item.checked === true).length}
          </span>
          /{fieldsContent.length})
        </div>
      </form>
      <span className="flex justify-center text-xs text-muted-foreground">
        <span>
          {dateLabel}{' '}
          {task &&
            (isEditable
              ? !isOwner && `(${t('form.permissions.shared')})`
              : `(${t('form.permissions.readOnly')})`)}
        </span>
      </span>
    </FormProvider>
  )
}
