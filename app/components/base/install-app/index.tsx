import {
  AppWindow,
  Download,
  EllipsisVertical,
  LucideIcon,
  Share,
  SquarePlus,
} from 'lucide-react'
import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal } from '~/components/base/modal'
import { TInstallSteps, useInstallApp } from '~/lib/hooks/use-install-app'

// The browser's own way to install, for browsers without an install prompt.
const stepsByBrowser: Record<
  TInstallSteps,
  { icon: LucideIcon; key: string }[]
> = {
  appleMobile: [
    { icon: Share, key: 'appleMobile.share' },
    { icon: SquarePlus, key: 'appleMobile.add' },
  ],
  safariMac: [{ icon: AppWindow, key: 'safariMac.dock' }],
  chromium: [
    { icon: Download, key: 'chromium.addressBar' },
    { icon: EllipsisVertical, key: 'chromium.menu' },
  ],
  firefoxAndroid: [
    { icon: EllipsisVertical, key: 'firefoxAndroid.menu' },
    { icon: Download, key: 'firefoxAndroid.install' },
  ],
}

type TProperties = {
  // Renders the trigger (a button, a menu item…) with the click handler.
  children: (properties: {
    onClick: () => void
    label: string
    icon: ReactNode
  }) => ReactNode
}

// Offers to install the app: the browser's own prompt where there is one,
// otherwise the steps for this browser. Renders nothing when the app is
// already installed or this browser can't install it.
export const InstallApp = (properties: TProperties) => {
  const { children } = properties
  const { t } = useTranslation()
  const { canInstall, steps, install } = useInstallApp()
  const [isOpen, setIsOpen] = useState(false)

  if (!canInstall) return null

  const handleClick = () => {
    if (steps) {
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
          {steps &&
            stepsByBrowser[steps].map(({ icon: Icon, key }) => (
              <li
                key={key}
                className="flex items-center gap-3"
              >
                <Icon className="size-5 shrink-0 text-primary" />
                {t(`install.steps.${key}`)}
              </li>
            ))}
        </ol>
      </Modal>
    </>
  )
}
