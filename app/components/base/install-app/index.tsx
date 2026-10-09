import { Download, SquarePlus, Share } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal } from '~/components/base/modal'
import { useInstallApp } from '~/lib/hooks/use-install-app'

type TProperties = {
  // Renders the trigger (a button, a menu item…) with the click handler.
  children: (properties: {
    onClick: () => void
    label: string
    icon: ReactNode
  }) => ReactNode
}

// Offers to install the app: the browser's own prompt where there is one,
// otherwise (iPhone, iPad) the Add to Home Screen steps. Renders nothing
// when the app is already installed or can't be installed.
export const InstallApp = (properties: TProperties) => {
  const { children } = properties
  const { t } = useTranslation()
  const { canInstall, needsInstructions, install } = useInstallApp()
  const [isOpen, setIsOpen] = useState(false)

  if (!canInstall) return null

  const handleClick = () => {
    if (needsInstructions) {
      setIsOpen(true)
      return
    }
    void install()
  }

  return (
    <>
      {children({
        onClick: handleClick,
        label: t('install.button'),
        icon: <Download className="size-4" />,
      })}
      <Modal
        open={isOpen}
        setOpen={setIsOpen}
        title={t('install.instructions.title')}
      >
        <ol className="grid gap-3 text-sm">
          <li className="flex items-center gap-3">
            <Share className="size-5 shrink-0 text-primary" />
            {t('install.instructions.share')}
          </li>
          <li className="flex items-center gap-3">
            <SquarePlus className="size-5 shrink-0 text-primary" />
            {t('install.instructions.add')}
          </li>
        </ol>
      </Modal>
    </>
  )
}
