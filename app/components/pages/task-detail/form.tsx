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
import { auth } from '~/lib/configs/firebase'
import { useCreateTask } from '~/lib/hooks/use-create-task'
import { useDebounce } from '~/lib/hooks/use-debounce'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateTask } from '~/lib/hooks/use-update-task'
import { TTaskForm } from '~/lib/types/task'
import { getDateLabel } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'
import { taskSchema } from '~/lib/validations/task'

import { TFormProperties } from './type'

export const Form = (properties: TFormProperties) => {
  const { tasks } = properties
  const { t, i18n } = useTranslation()
  const {
    selectedTask,
    handleDeleteTask,
    handlePinTask,
    handleShareTask,
    handleUnlinkTask,
    handleBackTask,
  } = useTask()
  const task = tasks?.find((n) => n.id === selectedTask?.id)
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
  } = useFieldArray({
    control: control,
    name: 'content',
  })
  const watchTitle = watch('title')
  const watchItem = watch('item')
  const watchContent = watch('content')

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
      if (item.length === 0) {
        remove(index)
      } else {
        update(index, {
          ...field,
          item: item,
        })
      }
      setFocus('item')
    }
    if (isBackspace && item.length === 0) {
      event.preventDefault()
      remove(index)
      setFocus('item')
    }
    if (isArrowUp) {
      event.preventDefault()
      const previousIndex = [...fieldsContent]
        .slice(0, index)
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
    if (isArrowDown) {
      event.preventDefault()
      const nextIndex = fieldsContent
        .map((field, index) => ({ field, index }))
        .slice(index + 1)
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
  }

  const handleNewItemKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    const contentLength = fieldsContent.length
    const index =
      [...fieldsContent]
        .map((field, index) => ({ field, index }))
        .reverse()
        .find(({ field }) => field.checked === false)?.index ??
      contentLength - 1
    const isEnter = event.key === 'Enter'
    const isBackspace = event.key === 'Backspace'
    const isArrowUp = event.key === 'ArrowUp'
    if (isEnter) {
      event.preventDefault()
      setSelectedEdit(undefined)
      if (watchItem.length === 0) return
      append({
        sequence: contentLength,
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
      if (contentLength > 0) {
        setSelectedEdit(index)
        requestAnimationFrame(() => {
          setFocus(`content.${index}.item`)
        })
      } else {
        setSelectedEdit(undefined)
        setFocus('title')
      }
    }
    if (isArrowUp) {
      event.preventDefault()
      if (contentLength > 0) {
        setSelectedEdit(index)
        requestAnimationFrame(() => {
          setFocus(`content.${index}.item`)
        })
      } else {
        setSelectedEdit(undefined)
        setFocus('title')
      }
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
      const base = fieldsContent.length
      let index = 0
      for (const line of lines) {
        append({
          sequence: base + index,
          checked: false,
          item: line,
        })
        index += 1
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
        <div className="sticky top-24 z-50 flex justify-center">
          {task ? (
            <Action
              className="w-full"
              isOwner={isOwner}
              isEditable={isEditable}
              isPinned={isPinned}
              handleDelete={() => handleDeleteTask({ task })}
              handlePin={() => handlePinTask({ task, isPinned: !isPinned })}
              handleShare={() => handleShareTask({ task })}
              handleUnlink={() => handleUnlinkTask({ task })}
              sharedCount={sharedCount}
              handleBack={() => handleBackTask()}
            />
          ) : (
            <Action
              className="w-full"
              isLoading={isCreatePending}
              isCreate={true}
              handleBack={() => handleBackTask()}
              disabled={!isDirty}
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
              leftNode={
                <input
                  type="hidden"
                  name={`content.${index}.sequence`}
                  value={index}
                />
              }
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
                          onClick={() => remove(index)}
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
