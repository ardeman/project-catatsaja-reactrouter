import { useRef, useState } from 'react'

import { useUserData } from './use-get-user'
import { useUpdateAiConsent } from './use-update-ai-consent'

// Runs an AI feature's action once the person has agreed to the notice
// (`AiNotice`) saying what goes to Google; the first time, the notice shows
// and the action runs when they agree. It runs inside their click, so it
// can open a file picker (browsers block one opened later).
export const useAiConsent = () => {
  const { data: userData } = useUserData()
  const { mutate: saveConsent } = useUpdateAiConsent()
  const [isOpen, setIsOpen] = useState(false)
  const pending = useRef<() => void>(undefined)

  const run = (action: () => void) => {
    if (userData?.aiConsent) {
      action()
      return
    }
    pending.current = action
    setIsOpen(true)
  }

  const handleAgree = () => {
    setIsOpen(false)
    const action = pending.current
    pending.current = undefined
    action?.()
    saveConsent(true)
  }

  return { run, notice: { open: isOpen, setOpen: setIsOpen, handleAgree } }
}
