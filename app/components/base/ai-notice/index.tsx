import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal } from '~/components/base/modal'

// The one-time notice before an AI feature first sends something to Google
// (see `useAiConsent`).
export const AiNotice = (properties: {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  handleAgree: () => void
}) => {
  const { open, setOpen, handleAgree } = properties
  const { t } = useTranslation()
  return (
    <Modal
      open={open}
      setOpen={setOpen}
      title={t('ai.notice.title')}
      handleConfirm={handleAgree}
      confirmLabel={t('ai.notice.confirm')}
    >
      <div className="grid gap-2 text-sm text-muted-foreground">
        <p>{t('ai.notice.send')}</p>
        <p>{t('ai.notice.encryption')}</p>
        <p>{t('ai.notice.check')}</p>
      </div>
    </Modal>
  )
}
