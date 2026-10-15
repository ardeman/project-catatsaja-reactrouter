import { LoaderCircle, Mic, Square } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { Modal } from '~/components/base/modal'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { toast } from '~/lib/hooks/use-toast'
import { useTranscribeAudio } from '~/lib/hooks/use-transcribe-audio'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { TProperties } from './type'

// Long enough for a spoken note, short enough to send in one request.
const MAX_SECONDS = 5 * 60

// What browsers record that Gemini reads; the first one supported is used.
const AUDIO_TYPES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg']

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () =>
      resolve(String(reader.result).split(',', 2)[1] ?? ''),
    )
    reader.addEventListener('error', () => reject(reader.error))
    reader.readAsDataURL(blob)
  })

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

// Records the person's voice and has Gemini write it down, in whatever
// language they speak. The recording is sent only when they stop, and the
// transcript can be edited before it is inserted. Opened through
// `useAiConsent`, so the notice comes first.
export const Dictation = (properties: TProperties) => {
  const { open, setOpen, onInsert, hint, kind } = properties
  const { t } = useTranslation()
  const textId = useId()
  const { mutate: transcribe, isPending } = useTranscribeAudio()
  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [text, setText] = useState<string>()
  const recorder = useRef<MediaRecorder>(undefined)
  // Set when the dialog closes mid-recording, so nothing is sent.
  const discard = useRef(false)

  const stop = () => {
    if (recorder.current?.state === 'recording') recorder.current.stop()
  }

  const start = async () => {
    const type = AUDIO_TYPES.find((value) =>
      globalThis.MediaRecorder?.isTypeSupported(value),
    )
    if (!type || !navigator.mediaDevices?.getUserMedia) {
      toast({
        variant: 'destructive',
        description: getErrorMessage(new Error('dictation/unsupported')),
      })
      return
    }
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      toast({
        variant: 'destructive',
        description: getErrorMessage(new Error('dictation/microphone')),
      })
      return
    }
    const chunks: Blob[] = []
    const next = new MediaRecorder(stream, {
      mimeType: type,
      audioBitsPerSecond: 32_000,
    })
    next.addEventListener('dataavailable', (event) => {
      chunks.push(event.data)
    })
    next.addEventListener('stop', async () => {
      for (const track of stream.getTracks()) track.stop()
      recorder.current = undefined
      setIsRecording(false)
      if (discard.current) return
      const blob = new Blob(chunks, { type: next.mimeType })
      const answer = await transcribe(
        {
          // Gemini takes the plain type, without the codec.
          mimeType: (next.mimeType || type).split(';', 1)[0] ?? 'audio/webm',
          data: await toBase64(blob),
        },
        kind,
      )
      if (answer) setText(answer)
    })
    discard.current = false
    recorder.current = next
    setSeconds(0)
    setIsRecording(true)
    next.start()
  }

  useEffect(() => {
    if (!isRecording) return
    const startedAt = Date.now()
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      setSeconds(elapsed)
      if (elapsed >= MAX_SECONDS) stop()
    }, 250)
    return () => clearInterval(timer)
  }, [isRecording])

  // Closing the dialog or leaving the page drops the recording.
  const close = () => {
    discard.current = true
    stop()
    setText(undefined)
    setOpen(false)
  }
  useEffect(
    () => () => {
      discard.current = true
      stop()
    },
    [],
  )

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
      title={t('dictation.title')}
      description={t('dictation.description')}
    >
      {text === undefined ? (
        <div className="grid justify-items-center gap-3 py-2">
          <Button
            type="button"
            variant={isRecording ? 'destructive' : 'default'}
            className="size-16 rounded-full [&_svg]:size-6"
            onClick={isRecording ? stop : start}
            disabled={isPending}
            aria-label={t(isRecording ? 'dictation.stop' : 'dictation.start')}
            title={t(isRecording ? 'dictation.stop' : 'dictation.start')}
          >
            {isPending ? (
              <LoaderCircle className="animate-spin" />
            ) : isRecording ? (
              <Square />
            ) : (
              <Mic />
            )}
          </Button>
          <p
            role="status"
            aria-live="polite"
            className="text-sm text-muted-foreground tabular-nums"
          >
            {isPending
              ? t('dictation.working')
              : isRecording
                ? t('dictation.recording', {
                    time: formatTime(seconds),
                    max: formatTime(MAX_SECONDS),
                  })
                : t('dictation.ready')}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor={textId}>{t('dictation.transcript')}</Label>
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
              {t('dictation.again')}
            </Button>
            <Button
              onClick={handleInsert}
              disabled={!text.trim()}
            >
              {t('dictation.insert')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
