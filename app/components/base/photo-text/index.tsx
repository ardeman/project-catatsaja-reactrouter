import { Camera, LoaderCircle } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { Modal } from '~/components/base/modal'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { useReadPhotoText } from '~/lib/hooks/use-read-photo-text'

import { TProperties } from './type'

// Has Gemini write out the text in a photo (a page, a whiteboard, a
// handwritten list), in whatever language it is written. The photo is sent
// only once it is chosen, and the text can be edited before it is inserted.
// Opened through `useAiConsent`, so the notice comes first.
export const PhotoText = (properties: TProperties) => {
  const { open, setOpen, onInsert, hint, kind } = properties
  const { t } = useTranslation()
  const textId = useId()
  const fileInput = useRef<HTMLInputElement>(null)
  const { mutate: read, isPending } = useReadPhotoText()
  const [text, setText] = useState<string>()
  // Set when the dialog closes while a photo is read, so the answer is dropped.
  const discard = useRef(false)

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // The same photo can be chosen again after cancelling.
    event.target.value = ''
    if (!file) return
    discard.current = false
    const answer = await read(file, kind)
    if (answer && !discard.current) setText(answer)
  }

  const close = () => {
    discard.current = true
    setText(undefined)
    setOpen(false)
  }

  const handleInsert = () => {
    const value = text?.trim()
    if (!value) return
    onInsert(value)
    close()
  }

  return (
    <Modal
      open={open}
      setOpen={(value) => {
        if (!(typeof value === 'function' ? value(open) : value)) close()
      }}
      title={t('photoText.title')}
      description={t('photoText.description')}
    >
      <input
        ref={fileInput}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={handleFile}
        aria-hidden="true"
        tabIndex={-1}
      />
      {text === undefined ? (
        <div className="grid justify-items-center gap-3 py-2">
          <Button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={isPending}
          >
            {isPending ? <LoaderCircle className="animate-spin" /> : <Camera />}
            {t('photoText.choose')}
          </Button>
          <p
            role="status"
            aria-live="polite"
            className="text-sm text-muted-foreground"
          >
            {t(isPending ? 'photoText.working' : 'photoText.ready')}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor={textId}>{t('photoText.result')}</Label>
            <Textarea
              id={textId}
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="max-h-[50dvh] min-h-32"
            />
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setText(undefined)}
            >
              {t('photoText.again')}
            </Button>
            <Button
              onClick={handleInsert}
              disabled={!text.trim()}
            >
              {t('photoText.insert')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
