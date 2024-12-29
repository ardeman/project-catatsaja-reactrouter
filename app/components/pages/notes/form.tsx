import { zodResolver } from '@hookform/resolvers/zod'
import { forwardRef, useImperativeHandle } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Action, Textarea } from '~/components/base'
import { auth } from '~/lib/configs'
import {
  useCreateNote,
  useDebounce,
  useUpdateNote,
  useUserData,
} from '~/lib/hooks'
import { TNoteForm } from '~/lib/types'
import { getDateLabel } from '~/lib/utils'
import { noteSchema } from '~/lib/validations'

import { useNote } from './context'
import { TFormProps } from './type'

export const Form = forwardRef((props: TFormProps, ref) => {
  const { notes } = props
  const { t, i18n } = useTranslation()
  const {
    selectedNote,
    handleDeleteNote,
    handlePinNote,
    handleShareNote,
    handleUnlinkNote,
  } = useNote()
  const note = notes?.find((n) => n.id === selectedNote?.id)
  const dateLabel = note
    ? getDateLabel({
        updatedAt: note.updatedAt?.seconds,
        createdAt: note.createdAt.seconds,
        t,
        locale: i18n.language,
      })
    : ''
  const { data: userData } = useUserData()
  const isPinned = note?.isPinned
  const canWrite = note?.permissions?.write.includes(userData?.uid || '')
  const isOwner = note?.owner === userData?.uid
  const isEditable = isOwner || canWrite
  const sharedCount = new Set(
    [
      ...(note?.permissions?.read || []),
      ...(note?.permissions?.write || []),
    ].filter((uid) => uid !== auth?.currentUser?.uid),
  ).size
  const { mutate: mutateCreateNote } = useCreateNote()
  const { mutate: mutateUpdateNote } = useUpdateNote()
  const formMethods = useForm<TNoteForm>({
    resolver: zodResolver(noteSchema),
    values: {
      title: selectedNote?.title || '',
      content: selectedNote?.content || '',
    },
  })
  const {
    handleSubmit,
    watch,
    formState: { isDirty },
  } = formMethods
  const watchTitle = watch('title')
  const watchContent = watch('content')

  const onSubmit = handleSubmit(async (data) => {
    if ((data.title.length === 0 && data.content.length === 0) || !isDirty) {
      return
    }
    if (selectedNote) {
      mutateUpdateNote({ id: selectedNote.id, ...data })
      return
    }
    mutateCreateNote(data)
  })

  useDebounce({
    trigger: () => onSubmit(),
    watch: [watchTitle, watchContent],
    condition: !!selectedNote,
  })

  // Expose the submit function to the parent component via ref
  useImperativeHandle(ref, () => ({
    submit: () => onSubmit(),
  }))

  return (
    <FormProvider {...formMethods}>
      <form
        onSubmit={onSubmit}
        className="group/form is-shown space-y-4"
      >
        {note && (
          <Action
            isOwner={isOwner}
            isEditable={isEditable}
            isPinned={isPinned}
            handleDelete={() => handleDeleteNote({ note })}
            handlePin={() => handlePinNote({ note, isPinned: !isPinned })}
            handleShare={() => handleShareNote({ note })}
            handleUnlink={() => handleUnlinkNote({ note })}
            sharedCount={sharedCount}
          />
        )}
        <Textarea
          name="title"
          placeholder={t('notes.form.title.label')}
          inputClassName="border-none ring-0 text-xl md:text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 focus-visible:shadow-none focus:outline-none resize-none min-h-0"
          autoFocus={!selectedNote}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              formMethods.setFocus('content')
            }
          }}
        />
        <Textarea
          name="content"
          placeholder={t('notes.form.content.label')}
          inputClassName="border-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 focus-visible:shadow-none focus:outline-none resize-none"
        />
      </form>
      <span className="flex justify-center text-xs text-muted-foreground">
        {dateLabel}
      </span>
    </FormProvider>
  )
})
Form.displayName = 'Form'
