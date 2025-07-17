import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Action } from '~/components/base/action'
import { Checkbox } from '~/components/base/checkbox'
import { Textarea } from '~/components/base/textarea'
import { useTask } from '~/components/pages/tasks'
import { Checkbox as UICheckbox } from '~/components/ui/checkbox'
import { Textarea as UITextarea } from '~/components/ui/textarea'
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
  const MAX_CONTENT_ITEMS = 100
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
          sequence: 0,
          checked: false,
          item: '',
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
    watch: [watchTitle, watchContent],
    condition: !!selectedTask,
  })

  useEffect(() => {
    if (focusIndexReference.current !== null) {
      setFocus(`content.${focusIndexReference.current}.item`)
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
            if (event.key === 'Enter' || event.key === 'ArrowDown') {
              event.preventDefault()
              setFocus('content.0.item')
            }
          }}
          readOnly={task && !isEditable}
        />
        {Array.from({ length: MAX_CONTENT_ITEMS }).map((_, index) => {
          const field = fields[index]
          const hidden = index >= fields.length
          return (
            <div
              key={field?.id ?? `hidden-${index}`}
              className={cn('flex items-start gap-2', hidden && 'hidden')}
            >
              {hidden ? (
                <>
                  <UICheckbox disabled className="m-0" />
                  <UITextarea disabled className="hidden" />
                </>
              ) : (
                <Checkbox
                  name={`content.${index}.checked`}
                  disabled={task && !isEditable}
                  className="m-0"
                  leftNode={
                    <input
                      type="hidden"
                      name={`content.${index}.sequence`}
                      value={index}
                    />
                  }
                  rightNode={
                    <Textarea
                      name={`content.${index}.item`}
                      placeholder={t('tasks.form.item.label')}
                      containerClassName="flex-1"
                      inputClassName="border-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 focus-visible:shadow-none focus:outline-none resize-none min-h-fit"
                      rows={1}
                      readOnly={task && !isEditable}
                      onKeyDown={(event) => {
                        const isEnter = event.key === 'Enter'
                        const isBackspace = event.key === 'Backspace'
                        const isArrowUp = event.key === 'ArrowUp'
                        const isArrowDown = event.key === 'ArrowDown'
                        const isEmpty = !getValues(`content.${index}.item`)

                        if (isEnter) {
                          event.preventDefault()
                          if (index === fields.length - 1) {
                            if (fields.length < MAX_CONTENT_ITEMS) {
                              focusIndexReference.current = fields.length
                              append({
                                sequence: fields.length,
                                checked: false,
                                item: '',
                              })
                            }
                          } else {
                            setFocus(`content.${index + 1}.item`)
                          }
                        }

                        if (isBackspace && isEmpty) {
                          event.preventDefault()
                          if (fields.length > 1) {
                            focusIndexReference.current = Math.max(0, index - 1)
                            remove(index)
                          } else {
                            setFocus('title')
                          }
                        }

                        if (isArrowUp) {
                          event.preventDefault()
                          if (index > 0) {
                            setFocus(`content.${index - 1}.item`)
                          } else {
                            setFocus('title')
                          }
                        }

                        if (isArrowDown) {
                          event.preventDefault()
                          if (index < fields.length - 1) {
                            setFocus(`content.${index + 1}.item`)
                          }
                        }
                      }}
                    />
                  }
                />
              )}
            </div>
          )
        })}
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
