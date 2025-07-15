import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash } from 'lucide-react'
import { forwardRef, useImperativeHandle } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
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

export const Form = forwardRef((properties: TFormProperties, reference) => {
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
  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: 'content',
  })
  const {
    handleSubmit,
    watch,
    formState: { isDirty },
  } = formMethods
  const watchTitle = watch('title')

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
    watch: [watchTitle],
    condition: !!selectedTask,
  })

  // Expose the submit function to the parent component via ref
  useImperativeHandle(reference, () => ({
    submit: () => onSubmit(),
  }))

  return (
    <FormProvider {...formMethods}>
      <form
        onSubmit={onSubmit}
        className="group/form is-shown space-y-4"
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
              formMethods.setFocus('content.0.description')
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
                    append({
                      sequence: fields.length,
                      checked: false,
                      description: '',
                    })
                    formMethods.setFocus(`content.${fields.length}.description`)
                  } else {
                    formMethods.setFocus(`content.${index + 1}.description`)
                  }
                }
                if (
                  event.key === 'Backspace' &&
                  !formMethods.getValues(`content.${index}.description`) &&
                  fields.length > 1
                ) {
                  event.preventDefault()
                  remove(index)
                }
              }}
              disabled={task && !isEditable}
              className="m-0"
            />
            <input
              type="hidden"
              {...formMethods.register(`content.${index}.sequence`)}
              value={index}
            />
            {isEditable && (
              <Button
                type="button"
                variant="ghost"
                className="h-4 w-4 p-0"
                onClick={() => remove(index)}
              >
                <Trash className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        {isEditable && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              append({
                sequence: fields.length,
                checked: false,
                description: '',
              })
              formMethods.setFocus(`content.${fields.length}.description`)
            }}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
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
})
Form.displayName = 'Form'
