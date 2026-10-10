import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Action } from '~/components/base/action'
import { MilkdownEditor } from '~/components/base/milkdown-editor'
import { SaveStatus, TSaveStatus } from '~/components/base/save-status'
import { Textarea } from '~/components/base/textarea'
import { useNote } from '~/components/pages/notes'
import { auth } from '~/lib/configs/firebase'
import { useAutosave } from '~/lib/hooks/use-autosave'
import { useCreateNote } from '~/lib/hooks/use-create-note'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateNote } from '~/lib/hooks/use-update-note'
import { TNoteForm } from '~/lib/types/note'
import { getDateLabel } from '~/lib/utils/parser'
import { noteSchema } from '~/lib/validations/note'

import { TFormProperties } from './type'

export const Form = (properties: TFormProperties) => {
  const { note } = properties
  const { t, i18n } = useTranslation()
  const {
    selectedNote,
    handleDeleteNote,
    handlePinNote,
    handleShareNote,
    handleUnlinkNote,
    handleBackNote,
  } = useNote()
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
  const isReadOnly = !!note && !isEditable
  const sharedCount = new Set(
    [
      ...(note?.permissions?.read || []),
      ...(note?.permissions?.write || []),
    ].filter((uid) => uid !== auth?.currentUser?.uid),
  ).size
  const { mutate: mutateCreateNote, isPending: isCreatePending } =
    useCreateNote()
  const navigate = useNavigate()
  const { mutate: mutateUpdateNote } = useUpdateNote()
  const formMethods = useForm<TNoteForm>({
    resolver: zodResolver(noteSchema),
    values: {
      title: selectedNote?.title || '',
      content: selectedNote?.content || '',
    },
    // Changes saved elsewhere must not overwrite what is being typed.
    resetOptions: { keepDirtyValues: true },
  })
  const {
    watch,
    getValues,
    formState: { isDirty },
    setFocus,
  } = formMethods
  const watchTitle = watch('title')
  const watchContent = watch('content')
  const syncEditor = useRef<(() => void) | null>(null)
  const registerSync = useCallback((sync: (() => void) | null) => {
    syncEditor.current = sync
  }, [])
  const isCreating = useRef(false)
  const [saveStatus, setSaveStatus] = useState<TSaveStatus>('idle')

  // Writes only what differs from the stored note, so it is safe to call at
  // any time (autosave, leaving the page, the Save button).
  const save = async () => {
    if (isReadOnly) return
    syncEditor.current?.()
    const data = getValues()
    if (selectedNote) {
      const changes: Partial<TNoteForm> = {}
      if (data.title !== (selectedNote.title || '')) changes.title = data.title
      if (data.content !== (selectedNote.content || ''))
        changes.content = data.content
      if (Object.keys(changes).length === 0) return
      setSaveStatus('saving')
      const isSaved = await mutateUpdateNote({
        id: selectedNote.id,
        ...changes,
      })
      setSaveStatus(isSaved ? 'saved' : 'error')
      return
    }
    if (isCreating.current || (!data.title && !data.content.trim())) return
    isCreating.current = true
    const reference = await mutateCreateNote(data)
    // Stays set after success: the page switches to the new item and this
    // form unmounts, which must not create it a second time.
    if (!reference) isCreating.current = false
    return reference
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    const reference = await save()
    if (reference) navigate(`/notes/${reference.id}`, { replace: true })
  }

  useAutosave({
    save,
    watch: [watchTitle, watchContent],
    saveWhenIdle: !!selectedNote,
  })

  return (
    <FormProvider {...formMethods}>
      <form
        onSubmit={handleCreate}
        className="group/form is-shown mx-auto w-full max-w-6xl space-y-4"
      >
        <div className="sticky top-20 z-40 flex justify-center md:top-24">
          {note ? (
            <Action
              className="w-full"
              buttonClassName="glass-surface"
              isOwner={isOwner}
              isEditable={isEditable}
              isPinned={isPinned}
              handleDelete={() => handleDeleteNote({ note })}
              handlePin={() => handlePinNote({ note, isPinned: !isPinned })}
              handleShare={() => handleShareNote({ note })}
              handleUnlink={() => handleUnlinkNote({ note })}
              sharedCount={sharedCount}
              handleBack={handleBackNote}
            />
          ) : (
            <Action
              className="w-full"
              buttonClassName="glass-surface"
              isLoading={isCreatePending}
              isCreate={true}
              handleBack={handleBackNote}
              disabled={!isDirty}
            />
          )}
        </div>
        <Textarea
          name="title"
          placeholder={t('notes.form.title.label')}
          inputClassName="border-none ring-0 text-xl md:text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 focus-visible:shadow-none focus:outline-hidden resize-none min-h-0"
          autoFocus={!note} // eslint-disable-line jsx-a11y/no-autofocus -- new notes only; `note` is set from the first render
          rows={1}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'ArrowDown') {
              event.preventDefault()
              setFocus('content')
            }
          }}
          readOnly={isReadOnly}
        />
        <MilkdownEditor
          key={selectedNote?.id ?? 'create'}
          name="content"
          placeholder={t('notes.form.content.label')}
          previousName="title"
          readOnly={isReadOnly}
          value={selectedNote?.content}
          registerSync={registerSync}
        />
      </form>
      <span className="flex justify-center gap-2 text-xs text-muted-foreground">
        <span>
          {dateLabel}{' '}
          {note &&
            (isEditable
              ? !isOwner && `(${t('form.permissions.shared')})`
              : `(${t('form.permissions.readOnly')})`)}
        </span>
        <SaveStatus status={saveStatus} />
      </span>
    </FormProvider>
  )
}
