import {
  Languages,
  ListChecks,
  ListCollapse,
  LoaderCircle,
  Mic,
  Sparkles,
  SpellCheck,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { AiNotice } from '~/components/base/ai-notice'
import { Button } from '~/components/base/button'
import { Dictation } from '~/components/base/dictation'
import { Markdown } from '~/components/base/markdown'
import { Modal } from '~/components/base/modal'
import { Button as UIButton } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { useAiConsent } from '~/lib/hooks/use-ai-consent'
import { useCreateTask } from '~/lib/hooks/use-create-task'
import { useNoteHelper } from '~/lib/hooks/use-note-helper'
import { TNoteHelper, TNoteHelperResult } from '~/lib/types/note'

import { TAiHelpersProperties } from './type'

const helpers: { key: TNoteHelper; icon: typeof Sparkles }[] = [
  { key: 'summarise', icon: ListCollapse },
  { key: 'tidy', icon: SpellCheck },
  { key: 'translate', icon: Languages },
  { key: 'checklist', icon: ListChecks },
]

// Gemini helpers for a note: dictate, summarise, tidy up, translate and turn
// into a checklist. The note goes to Google only when a helper is picked, after
// agreeing once to `AiNotice`, and the result is previewed before it is
// applied. Changing the note needs write access; a checklist is a new task
// list, so readers can make one too. Dictating needs no content (it adds
// some), and sends only the recording.
export const AiHelpers = (properties: TAiHelpersProperties) => {
  const { getNote, isEditable, hasContent, onApply, triggerClassName } =
    properties
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { run, notice } = useAiConsent()
  const { mutate: runHelper, pending } = useNoteHelper()
  const { mutate: createTask, isPending: isCreating } = useCreateTask()
  const [isDictating, setIsDictating] = useState(false)
  const [result, setResult] = useState<{
    helper: TNoteHelper
    answer: TNoteHelperResult
  }>()

  const handlePick = (helper: TNoteHelper) =>
    run(async () => {
      const { title, content } = getNote()
      const answer = await runHelper({ helper, title, content })
      if (answer) setResult({ helper, answer })
    })

  const handleApply = async () => {
    if (!result) return
    const { helper, answer } = result
    if (helper === 'checklist') {
      const reference = await createTask({
        title: answer.title.trim(),
        content: answer.items
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => ({ checked: false, item })),
      })
      if (!reference) return
      setResult(undefined)
      navigate(`/tasks/${reference.id}`)
      return
    }
    const { title, content } = getNote()
    onApply(
      helper === 'summarise'
        ? { title, content: `${answer.markdown.trim()}\n\n${content}` }
        : {
            title: answer.title.trim() || title,
            content: answer.markdown.trim(),
          },
    )
    setResult(undefined)
  }

  const handleDictate = () => run(() => setIsDictating(true))

  const handleInsert = (text: string) => {
    const { title, content } = getNote()
    onApply({
      title,
      content: content.trim() ? `${content.trimEnd()}\n\n${text}` : text,
    })
  }

  const available = helpers.filter(
    ({ key }) => isEditable || key === 'checklist',
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <UIButton
            type="button"
            variant="outline"
            className={triggerClassName}
            disabled={!!pending || (!hasContent && !isEditable)}
            aria-label={t(pending ? 'notes.ai.working' : 'notes.ai.menu')}
            title={t(
              hasContent || isEditable ? 'notes.ai.menu' : 'notes.ai.empty',
            )}
            aria-busy={!!pending}
          >
            {pending ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
          </UIButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="glass-surface"
        >
          {isEditable && (
            <DropdownMenuItem onSelect={handleDictate}>
              <Mic className="size-4" />
              {t('notes.ai.dictate')}
            </DropdownMenuItem>
          )}
          {available.map(({ key, icon: Icon }) => (
            <DropdownMenuItem
              key={key}
              onSelect={() => handlePick(key)}
              disabled={!hasContent}
            >
              <Icon className="size-4" />
              {t(`notes.ai.${key}.action`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Kept mounted so screen readers announce the change. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+var(--nav-bottom))] z-40 flex justify-center px-4 md:bottom-6"
      >
        {pending && (
          <p className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm shadow-md">
            <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" />
            {t(`notes.ai.${pending}.working`)}
          </p>
        )}
      </div>
      <Modal
        open={!!result}
        setOpen={(open) => {
          if (!open) setResult(undefined)
        }}
        title={result && t(`notes.ai.${result.helper}.title`)}
      >
        {result && (
          <div className="grid gap-3">
            <div className="max-h-[50dvh] overflow-y-auto rounded-lg border p-3">
              {result.helper === 'checklist' ? (
                <div className="grid gap-2">
                  {result.answer.title.trim() && (
                    <p className="font-semibold">{result.answer.title}</p>
                  )}
                  <ul className="grid list-disc gap-1 pl-5 text-sm">
                    {result.answer.items
                      .filter((item) => item.trim())
                      .map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                  </ul>
                </div>
              ) : (
                <div className="grid gap-2">
                  {result.helper !== 'summarise' &&
                    result.answer.title.trim() && (
                      <p className="font-semibold">{result.answer.title}</p>
                    )}
                  <Markdown className="text-sm wrap-break-word">
                    {result.answer.markdown}
                  </Markdown>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t(`notes.ai.${result.helper}.hint`)}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setResult(undefined)}
              >
                {t('form.cancel')}
              </Button>
              <Button
                onClick={handleApply}
                isLoading={isCreating}
                disabled={isCreating}
              >
                {t(`notes.ai.${result.helper}.apply`)}
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <Dictation
        open={isDictating}
        setOpen={setIsDictating}
        onInsert={handleInsert}
        hint={t('notes.ai.dictateHint')}
      />
      <AiNotice {...notice} />
    </>
  )
}
