import { Check, Sparkles } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal } from '~/components/base/modal'
import { useMintPlusCheckout } from '~/lib/hooks/use-mint-plus-checkout'
import { usePlan } from '~/lib/hooks/use-plan'

type TProperties = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

const sections = [
  { key: 'adds', icon: Sparkles },
  { key: 'free', icon: Check },
] as const

// What Catat Saja Plus adds, what stays free, and how to buy (when checkout
// is enabled via VITE_PLUS_CHECKOUT_URL). Held by the caller, outside menus
// that close when it opens.
export const PlusInfo = ({ open, setOpen }: TProperties) => {
  const { t } = useTranslation()
  const { hasPlus } = usePlan()
  const { canCheckout, loading, openCheckout } = useMintPlusCheckout()

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      title={t('plus.info.title')}
      description={t('plus.info.description')}
      confirmLabel={
        canCheckout
          ? t(hasPlus ? 'plus.info.renew' : 'plus.info.buy')
          : undefined
      }
      handleConfirm={
        canCheckout && !loading
          ? () => {
              void openCheckout()
            }
          : undefined
      }
    >
      <div className="grid gap-4 text-sm">
        {sections.map(({ key, icon: Icon }) => (
          <section
            key={key}
            className="grid gap-2"
          >
            <h3 className="font-medium">{t(`plus.info.${key}.title`)}</h3>
            <ul className="grid gap-1.5">
              {(
                t(`plus.info.${key}.items`, { returnObjects: true }) as string[]
              ).map((item) => (
                <li
                  key={item}
                  className="flex gap-2"
                >
                  <Icon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-primary"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-muted-foreground">
          {t(canCheckout ? 'plus.info.paymentsOpen' : 'plus.info.payments')}
        </p>
      </div>
    </Modal>
  )
}
