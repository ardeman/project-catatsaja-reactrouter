import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Action } from '~/components/base/action'
import { Button } from '~/components/base/button'
import { Checkbox as BaseCheckbox } from '~/components/base/checkbox'
import { Textarea } from '~/components/base/textarea'
import { useTask } from '~/components/pages/tasks'
import { auth } from '~/lib/configs/firebase'
import { useCreateTask } from '~/lib/hooks/use-create-task'
import { useDebounce } from '~/lib/hooks/use-debounce'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateTask } from '~/lib/hooks/use-update-task'
import { TTaskForm } from '~/lib/types/task'
import { getDateLabel } from '~/lib/utils/parser'
import { taskSchema } from '~/lib/validations/task'

import { TFormProperties } from './type'

const buttonClassName =
  'ring-offset-background focus:ring-ring bg-accent text-muted-foreground h-5 w-full rounded-full p-0 opacity-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none group-hover/card:opacity-100 group-[.is-shown]/form:opacity-100 sm:opacity-0'

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
    resolver: zodResolver(taskSchema),
    values: {
      title: selectedTask?.title || '',
      content: selectedTask?.content || [
        {
          sequence: 1,
          checked: false,
          description: '',
        },
      ],
    },
  })
  const {
    handleSubmit,
    watch,
    formState: { isDirty },
    setFocus,
    control,
    getValues,
  } = formMethods
  const { fields, append, remove } = useFieldArray({
    control: control,
    name: 'content',
  })
  const watchTitle = watch('title')
  const watchContent = useWatch({ control: control, name: 'content' })
  const serializedContent = JSON.stringify(watchContent)
  const checkedStates = watchContent.map((item) => item.checked).join(',')

  const focusIndexReference = useRef<number | null>(null)

  const onSubmit = handleSubmit(async (data) => {
    const payload = {
      ...data,
      content: data.content.map((item, index) => ({
        ...item,
        sequence: index,
      })),
    }
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
    watch: [watchTitle, serializedContent, checkedStates],
    condition: !!selectedTask,
  })

  useEffect(() => {
    if (focusIndexReference.current !== null) {
      setFocus(`content.${focusIndexReference.current}.description`)
      focusIndexReference.current = null
    }
  }, [fields.length, setFocus])

  return (
    <FormProvider {...formMethods}>
      <form
        onSubmit={onSubmit}
        className="group/form is-shown mx-auto w-full max-w-6xl space-y-4"
      >
        {task ? (
          <Action
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
            isLoading={isCreatePending}
            isCreate={true}
            handleBack={() => handleBackTask()}
            disabled={!isDirty}
          />
        )}
        <Textarea
          name="title"
          placeholder={t('tasks.form.title.label')}
          inputClassName="border-none ring-0 text-xl md:text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 focus-visible:shadow-none focus:outline-none resize-none min-h-0"
          autoFocus={!selectedTask} // eslint-disable-line jsx-a11y/no-autofocus
          rows={1}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              setFocus('content.0.description')
            }
          }}
          readOnly={task && !isEditable}
        />
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-start gap-2"
          >
            <BaseCheckbox
              index={index}
              sequenceName={`content.${index}.sequence`}
              name={`content.${index}.checked`}
              textareaName={`content.${index}.description`}
              placeholder={t('tasks.form.content.label')}
              textareaContainerClassName="flex-1"
              textareaClassName="border-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 focus-visible:shadow-none focus:outline-none resize-none min-h-fit"
              rows={1}
              readOnly={task && !isEditable}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  if (index === fields.length - 1) {
                    focusIndexReference.current = fields.length
                    append({
                      sequence: fields.length,
                      checked: false,
                      description: '',
                    })
                  } else {
                    setFocus(`content.${index + 1}.description`)
                  }
                }
                if (
                  event.key === 'Backspace' &&
                  !getValues(`content.${index}.description`) &&
                  fields.length > 1
                ) {
                  event.preventDefault()
                  focusIndexReference.current = Math.max(0, index - 1)
                  remove(index)
                }
              }}
              disabled={task && !isEditable}
              className="m-0"
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            focusIndexReference.current = fields.length
            append({
              sequence: fields.length,
              checked: false,
              description: '',
            })
          }}
          className={buttonClassName}
        >
          <Plus className="h-4 w-4" />
        </Button>
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
