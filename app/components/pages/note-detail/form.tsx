import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useEventListener } from 'usehooks-ts'

import { Action, actionButtonClassName } from '~/components/base/action'
import { CardStyleLayer } from '~/components/base/card-style'
import {
  FormattingBar,
  MilkdownEditor,
  TEditorFormat,
} from '~/components/base/milkdown-editor'
import { SaveStatus, TSaveStatus } from '~/components/base/save-status'
import { Textarea } from '~/components/base/textarea'
import { useNote } from '~/components/pages/notes'
import { auth } from '~/lib/configs/firebase'
import { useAutosave } from '~/lib/hooks/use-autosave'
import { useCreateNote } from '~/lib/hooks/use-create-note'
import { useDocumentTitle } from '~/lib/hooks/use-document-title'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useStoredValues } from '~/lib/hooks/use-stored-values'
import { toast } from '~/lib/hooks/use-toast'
import { useUndoHistory } from '~/lib/hooks/use-undo-history'
import { useUpdateArchive } from '~/lib/hooks/use-update-archive'
import { useUpdateCardStyle } from '~/lib/hooks/use-update-card-style'
import { useUpdateNote } from '~/lib/hooks/use-update-note'
import { TCardStyle } from '~/lib/types/common'
import { TNoteForm } from '~/lib/types/note'
import { toCardStyle } from '~/lib/utils/card-style'
import { getDateLabel } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'
import { noteSchema } from '~/lib/validations/note'

import { AiHelpers } from './ai-helpers'
import { SidePanel } from './side-panel'
import { TFormProperties } from './type'

const isSameNote = (a: TNoteForm, b: TNoteForm) =>
  a.title === b.title && a.content === b.content

export const Form = (properties: TFormProperties) => {
  const { note } = properties
  const { t, i18n } = useTranslation()
  const { mutate: archive } = useUpdateArchive()
  const { mutate: updateCardStyle } = useUpdateCardStyle()
  const {
    handleDeleteNote,
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
  const canWrite = note?.permissions?.write.includes(userData?.uid || '')
  const isOwner = note?.owner === userData?.uid
  const isEditable = isOwner || canWrite
  const isReadOnly = !!note && !isEditable
  const permissionLabel = isEditable
    ? !isOwner && t('form.permissions.shared')
    : t('form.permissions.readOnly')
  const dateWithPermission =
    note && permissionLabel ? `${dateLabel} (${permissionLabel})` : dateLabel
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
  const storedValues = useMemo<TNoteForm>(
    () => ({ title: note?.title || '', content: note?.content || '' }),
    [note?.title, note?.content],
  )
  const formMethods = useForm<TNoteForm>({
    resolver: zodResolver(noteSchema),
    defaultValues: storedValues,
  })
  useStoredValues({ form: formMethods, stored: storedValues })
  const {
    control,
    getValues,
    setValue,
    formState: { isDirty },
    setFocus,
  } = formMethods
  const watchTitle = useWatch({ control, name: 'title' })
  useDocumentTitle(watchTitle || t('navigation.notes'))
  const watchContent = useWatch({ control, name: 'content' })
  const syncEditor = useRef<(() => void) | null>(null)
  const registerSync = useCallback((sync: (() => void) | null) => {
    syncEditor.current = sync
  }, [])
  const formatEditor = useRef<((value: TEditorFormat) => void) | null>(null)
  const registerFormat = useCallback(
    (format: ((value: TEditorFormat) => void) | null) => {
      formatEditor.current = format
    },
    [],
  )
  const [isFormatting, setIsFormatting] = useState(false)
  const [activeFormats, setActiveFormats] = useState<TEditorFormat[]>([])
  const isCreating = useRef(false)
  const formElement = useRef<HTMLFormElement>(null)
  const contentElement = useRef<HTMLDivElement>(null)
  // Bumped to start the editor again from the form, after an AI helper
  // changed the note (the editor only takes outside changes when idle).
  const [editorVersion, setEditorVersion] = useState(0)
  const [saveStatus, setSaveStatus] = useState<TSaveStatus>('idle')

  // Writes only what differs from the stored note, so it is safe to call at
  // any time (autosave, leaving the page, the Save button).
  const save = async () => {
    if (isReadOnly) return
    syncEditor.current?.()
    const data = getValues()
    if (note) {
      const changes: Partial<TNoteForm> = {}
      if (data.title !== (note.title || '')) changes.title = data.title
      if (data.content !== (note.content || '')) changes.content = data.content
      if (Object.keys(changes).length === 0) return
      setSaveStatus('saving')
      const isSaved = await mutateUpdateNote({
        id: note.id,
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

  useEventListener('keydown', (event) => {
    if (
      event.key.toLowerCase() !== 's' ||
      !(event.metaKey || event.ctrlKey) ||
      event.altKey ||
      event.isComposing ||
      !(event.target instanceof HTMLElement) ||
      event.target.closest('form') !== formElement.current
    )
      return
    event.preventDefault()
    if (!isReadOnly && !event.repeat) formElement.current?.requestSubmit()
  })

  // The note as on screen, with the editor's last words.
  const getNote = () => {
    syncEditor.current?.()
    const { title, content } = getValues()
    return { title, content }
  }

  const replaceNote = (next: { title: string; content: string }) => {
    setValue('title', next.title, { shouldDirty: true })
    setValue('content', next.content, { shouldDirty: true })
    setEditorVersion((version) => version + 1)
  }

  // Undo and redo over the title and text together, in steps (a pause in
  // typing, or an AI helper's change); the editor's own Ctrl/⌘ Z still
  // works letter by letter inside it.
  const current = useMemo(
    () => ({ title: watchTitle, content: watchContent }),
    [watchTitle, watchContent],
  )
  const history = useUndoHistory({
    key: note?.id ?? 'create',
    value: current,
    stored: storedValues,
    isEqual: isSameNote,
  })
  const handleUndo = () => {
    const previous = history.undo(getNote())
    if (previous) replaceNote(previous)
  }
  const handleRedo = () => {
    const next = history.redo(getNote())
    if (next) replaceNote(next)
  }

  // An AI helper's result, after the person accepted the preview: a step of
  // its own, undone from the bar.
  const handleApply = (next: { title: string; content: string }) => {
    history.checkpoint(getNote())
    replaceNote(next)
    toast({ description: t('notes.ai.applied') })
  }

  const historyActions = isReadOnly
    ? {}
    : {
        handleUndo,
        handleRedo,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
      }
  const aiMenu = (buttonClassName: string) => (
    <AiHelpers
      getNote={getNote}
      isEditable={!isReadOnly}
      hasContent={!!watchContent.trim()}
      onApply={handleApply}
      triggerClassName={buttonClassName}
    />
  )

  useAutosave({
    save,
    watch: [watchTitle, watchContent],
    saveWhenIdle: !!note,
  })

  return (
    <FormProvider {...formMethods}>
      <div className="mx-auto grid w-full max-w-4xl items-start gap-6 xl:max-w-6xl xl:grid-cols-[minmax(0,1fr)_16rem]">
        <form
          ref={formElement}
          onSubmit={handleCreate}
          className="group/form is-shown w-full space-y-4"
        >
          <CardStyleLayer
            isPage
            cardStyle={toCardStyle(note?.cardStyle)}
          />
          <div className="sticky top-[calc(1rem+var(--top-inset))] z-40 flex flex-col gap-1 md:top-8">
            <Action
              className="w-full"
              buttonClassName="glass-surface"
              isLoading={isCreatePending}
              isCreate={!note}
              disabled={!note && !isDirty}
              handleBack={handleBackNote}
              {...(note && {
                isOwner,
                isEditable,
                handleDelete: () => handleDeleteNote({ note }),
                isArchived: note.isArchived,
                handleArchive: () =>
                  archive('notes', note.id, !note.isArchived),
                handleShare: () => handleShareNote({ note }),
                handleUnlink: () => handleUnlinkNote({ note }),
                sharedCount,
                cardStyle: toCardStyle(note.cardStyle),
                handleCardStyle: (next: TCardStyle) =>
                  updateCardStyle('notes', note.id, next),
              })}
              {...historyActions}
              {...(!isReadOnly && {
                handleToggleFormat: () => setIsFormatting((value) => !value),
                isFormatting,
              })}
              extra={aiMenu}
            />
            {isFormatting && !isReadOnly && (
              <FormattingBar
                buttonClassName={cn(actionButtonClassName, 'glass-surface')}
                active={activeFormats}
                onFormat={(value) => formatEditor.current?.(value)}
              />
            )}
          </div>
          <div
            ref={contentElement}
            className="glass-surface rounded-xl border p-4 sm:p-6 md:p-8 [&_:is(h1,h2,h3,h4,h5,h6)]:scroll-mt-28"
          >
            <Textarea
              name="title"
              aria-label={t('notes.form.title.label')}
              placeholder={t('notes.form.title.label')}
              inputClassName="border-none ring-0 text-xl md:text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 focus-visible:shadow-none focus:outline-hidden resize-none min-h-0"
              autoFocus={!note} // eslint-disable-line jsx-a11y/no-autofocus -- new notes only; `note` is set from the first render
              rows={1}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== 'ArrowDown') {
                  return
                }

                event.preventDefault()
                setFocus('content')
              }}
              readOnly={isReadOnly}
            />
            <div className="mt-5">
              <MilkdownEditor
                key={`${note?.id ?? 'create'}-${editorVersion}`}
                name="content"
                label={t('notes.form.content.label')}
                placeholder={t('notes.form.content.placeholder')}
                previousName="title"
                readOnly={isReadOnly}
                value={note?.content}
                registerSync={registerSync}
                registerFormat={registerFormat}
                onActiveFormatsChange={setActiveFormats}
              />
            </div>
            {!isReadOnly && !watchContent.trim() && (
              <p className="mt-4 text-xs text-muted-foreground">
                {t('notes.form.content.hint')}
              </p>
            )}
          </div>
          {!isReadOnly && (
            <p className="text-center text-xs text-muted-foreground">
              {t('notes.form.saveShortcut')}
            </p>
          )}
        </form>
        <SidePanel
          contentReference={contentElement}
          dateLabel={dateWithPermission}
          saveStatus={saveStatus}
        />
      </div>
      <span className="flex justify-center gap-2 text-xs text-muted-foreground xl:hidden">
        <span>{dateWithPermission}</span>
        <SaveStatus status={saveStatus} />
      </span>
    </FormProvider>
  )
}
