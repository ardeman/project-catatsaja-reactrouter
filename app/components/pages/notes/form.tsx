import { zodResolver } from '@hookform/resolvers/zod'
import { forwardRef, useImperativeHandle } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Action } from '~/components/base/action'
import { Textarea } from '~/components/base/textarea'
import { auth } from '~/lib/configs/firebase'
import { useCreateNote } from '~/lib/hooks/use-create-note'
import { useDebounce } from '~/lib/hooks/use-debounce'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateNote } from '~/lib/hooks/use-update-note'
import { TNoteForm } from '~/lib/types/note'
import { getDateLabel } from '~/lib/utils/parser'
import { noteSchema } from '~/lib/validations/note'

import { useNote } from './context'
import { TFormProperties } from './type'

export const Form = forwardRef((properties: TFormProperties, reference) => {
  const { notes, isDetailPage } = properties
  const { t, i18n } = useTranslation()
  const {
    selectedNote,
    handleDeleteNote,
    handlePinNote,
    handleShareNote,
    handleUnlinkNote,
    handleOpenNote,
    handleBackNote,
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
  useImperativeHandle(reference, () => ({
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
            handleOpen={isDetailPage ? undefined : () => handleOpenNote(note)}
            handleBack={isDetailPage ? () => handleBackNote() : undefined}
          />
        )}
        <Textarea
          name="title"
          placeholder={t('notes.form.title.label')}
          inputClassName="border-none ring-0 text-xl md:text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 focus-visible:shadow-none focus:outline-none resize-none min-h-0"
          autoFocus={!selectedNote} // eslint-disable-line jsx-a11y/no-autofocus
          rows={1}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
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
