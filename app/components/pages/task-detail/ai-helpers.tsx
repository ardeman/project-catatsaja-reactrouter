import {
  ClipboardPaste,
  Languages,
  ListPlus,
  ListTree,
  LoaderCircle,
  Mic,
  Sparkles,
} from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AiNotice } from '~/components/base/ai-notice'
import { Button } from '~/components/base/button'
import { Dictation } from '~/components/base/dictation'
import { Modal } from '~/components/base/modal'
import { Button as UIButton } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { useAiConsent } from '~/lib/hooks/use-ai-consent'
import { useTaskHelper } from '~/lib/hooks/use-task-helper'
import { TTaskHelper } from '~/lib/types/task'

import { TAiHelpersProperties, TTaskList } from './type'

const helpers: { key: TTaskHelper; icon: typeof Sparkles }[] = [
  { key: 'breakDown', icon: ListTree },
  { key: 'suggest', icon: ListPlus },
  { key: 'translate', icon: Languages },
]

const toItems = (items: string[]) =>
  items.map((item) => ({ checked: false, item }))

// Gemini helpers for a task list: dictate items, turn pasted text into items
// (and a title), break the open items into steps, suggest what is missing and
// translate. The list goes to Google only
// when a helper is picked, after agreeing once to `AiNotice`, and the new
// list is previewed before it replaces the one on screen. Dictating sends
// only the recording, and pasting only the pasted text. Only people who can edit the list get the menu.
export const AiHelpers = (properties: TAiHelpersProperties) => {
  const { getList, hasOpenItems, hasItems, onApply, triggerClassName } =
    properties
  const { t } = useTranslation()
  const { run, notice } = useAiConsent()
  const { mutate: runHelper, pending } = useTaskHelper()
  const [isDictating, setIsDictating] = useState(false)
  const [pasted, setPasted] = useState<string>()
  const pastedId = useId()
  const [result, setResult] = useState<{
    helper: TTaskHelper
    // What the preview shows: new or rewritten items.
    items: string[]
    list: TTaskList
  }>()

  const handlePick = (helper: TTaskHelper, text?: string) =>
    run(async () => {
      const { title, content } = getList()
      const answer = await runHelper({ helper, title, content, text })
      if (!answer) return
      const done = content.filter((item) => item.checked)
      const list: TTaskList =
        helper === 'fromText'
          ? {
              // A title the person wrote stays.
              title: title.trim() ? title : answer.title,
              content: [...content, ...toItems(answer.items)],
            }
          : helper === 'translate'
            ? {
                title: answer.title || title,
                content: content.map((item, index) => ({
                  ...item,
                  item: answer.items[index],
                })),
              }
            : {
                title,
                content:
                  helper === 'breakDown'
                    ? [...toItems(answer.items), ...done]
                    : [...content, ...toItems(answer.items)],
              }
      setResult({ helper, items: answer.items, list })
    })

  const handleApply = () => {
    if (!result) return
    onApply(result.list)
    setResult(undefined)
  }

  const handleDictate = () => run(() => setIsDictating(true))

  const handlePaste = () => run(() => setPasted(''))

  const handleConvert = () => {
    if (!pasted?.trim()) return
    const text = pasted
    setPasted(undefined)
    handlePick('fromText', text)
  }

  const handleInsert = (text: string) => {
    const { title, content } = getList()
    const items = text
      .split(/\r?\n/)
      .map((item) => item.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
      .filter(Boolean)
    onApply({ title, content: [...content, ...toItems(items)] })
  }

  const isAvailable = (helper: TTaskHelper) =>
    helper === 'breakDown' ? hasOpenItems : hasItems

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <UIButton
            type="button"
            variant="outline"
            className={triggerClassName}
            disabled={!!pending}
            aria-label={t(pending ? 'notes.ai.working' : 'notes.ai.menu')}
            title={t('notes.ai.menu')}
            aria-busy={!!pending}
          >
            {pending ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
          </UIButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={handleDictate}>
            <Mic className="size-4" />
            {t('tasks.ai.dictate')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handlePaste}>
            <ClipboardPaste className="size-4" />
            {t('tasks.ai.fromText.action')}
          </DropdownMenuItem>
          {helpers.map(({ key, icon: Icon }) => (
            <DropdownMenuItem
              key={key}
              onSelect={() => handlePick(key)}
              disabled={!isAvailable(key)}
            >
              <Icon className="size-4" />
              {t(`tasks.ai.${key}.action`)}
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
            {t(`tasks.ai.${pending}.working`)}
          </p>
        )}
      </div>
      <Modal
        open={pasted !== undefined}
        setOpen={(open) => {
          if (!open) setPasted(undefined)
        }}
        title={t('tasks.ai.fromText.pasteTitle')}
      >
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor={pastedId}>{t('tasks.ai.fromText.label')}</Label>
            <Textarea
              id={pastedId}
              value={pasted ?? ''}
              onChange={(event) => setPasted(event.target.value)}
              maxLength={20_000}
              className="max-h-[50dvh] min-h-40"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t('tasks.ai.fromText.pasteHint')}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setPasted(undefined)}
            >
              {t('form.cancel')}
            </Button>
            <Button
              onClick={handleConvert}
              disabled={!pasted?.trim()}
            >
              {t('tasks.ai.fromText.convert')}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={!!result}
        setOpen={(open) => {
          if (!open) setResult(undefined)
        }}
        title={result && t(`tasks.ai.${result.helper}.title`)}
      >
        {result && (
          <div className="grid gap-3">
            <div className="grid max-h-[50dvh] gap-2 overflow-y-auto rounded-lg border p-3">
              {(result.helper === 'translate' ||
                result.helper === 'fromText') &&
                result.list.title && (
                  <p className="font-semibold">{result.list.title}</p>
                )}
              <ul className="grid list-disc gap-1 pl-5 text-sm wrap-break-word">
                {result.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(`tasks.ai.${result.helper}.hint`)}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setResult(undefined)}
              >
                {t('form.cancel')}
              </Button>
              <Button onClick={handleApply}>
                {t(`tasks.ai.${result.helper}.apply`)}
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <Dictation
        open={isDictating}
        setOpen={setIsDictating}
        onInsert={handleInsert}
        hint={t('tasks.ai.dictateHint')}
        kind="list"
      />
      <AiNotice {...notice} />
    </>
  )
}
