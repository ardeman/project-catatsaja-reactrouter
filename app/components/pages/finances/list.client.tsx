import { Wallet } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import { Collection } from '~/components/base/collection'
import { Modal } from '~/components/base/modal'
import { Share } from '~/components/base/share'
import { useGetFinances } from '~/lib/hooks/use-get-finances'
import { useShareFinance } from '~/lib/hooks/use-share-finance'
import {
  THandleDeletePermission,
  THandleSetPermission,
} from '~/lib/types/common'
import { TFinancePermissionRequest } from '~/lib/types/finance'

import { Card } from './card'
import { useFinance } from './context'

export const List = () => {
  const { t } = useTranslation()
  const {
    openConfirmation,
    setOpenConfirmation,
    openShare,
    setOpenShare,
    selectedConfirmation,
    handleConfirm,
    selectedFinance,
    handleCreateFinance,
  } = useFinance()
  const { data: financesData, isLoading } = useGetFinances()
  const { mutate: mutateShare } = useShareFinance()

  const handleShare = (parameters: THandleSetPermission) => {
    const data = {
      ...parameters,
      finance: financesData?.find(
        (finance) => finance.id === selectedFinance?.id,
      ),
    } as TFinancePermissionRequest
    mutateShare(data)
  }

  const handleUnshare = (parameters: Pick<THandleDeletePermission, 'uid'>) => {
    const data = {
      ...parameters,
      permission: 'delete',
      finance: financesData?.find(
        (finance) => finance.id === selectedFinance?.id,
      ),
    } as TFinancePermissionRequest
    mutateShare(data)
  }

  return (
    <>
      <Collection
        items={financesData}
        isLoading={isLoading}
        layout="masonry"
        icon={Wallet}
        emptyTitle={t('finances.empty.title')}
        emptyDescription={t('finances.empty.description')}
        createLabel={t('finances.add')}
        onCreate={handleCreateFinance}
        getSearchText={(finance) =>
          [
            finance.title,
            ...(finance.content || []).flatMap((entry) => [
              entry.description,
              t(`finances.form.category.${entry.category}.label`),
            ]),
          ].join(' ')
        }
        renderCard={(finance, className) => (
          <Card
            finance={finance}
            key={finance.id}
            className={className}
          />
        )}
      />
      <Modal
        open={openConfirmation}
        setOpen={setOpenConfirmation}
        handleConfirm={handleConfirm}
        variant="destructive"
        title={
          <Trans
            i18nKey={`form.${selectedConfirmation?.kind}`}
            values={{ item: t('finances.title') }}
            components={{ span: <span className="text-primary" /> }}
          />
        }
      >
        {selectedConfirmation?.detail.title && (
          <p className="text-xl">{selectedConfirmation.detail.title}</p>
        )}
        <p className="text-muted-foreground">
          {t('finances.entries', {
            count: selectedConfirmation?.detail.content?.length ?? 0,
          })}
        </p>
      </Modal>

      <Modal
        open={openShare}
        setOpen={setOpenShare}
        title={
          <Trans
            i18nKey="form.share"
            values={{ item: t('finances.title') }}
            components={{ span: <span className="text-primary" /> }}
          />
        }
      >
        <Share
          path={`/finances/${selectedFinance?.id}`}
          write={
            financesData?.find((finance) => finance.id === selectedFinance?.id)
              ?.permissions?.write || []
          }
          read={
            financesData?.find((finance) => finance.id === selectedFinance?.id)
              ?.permissions?.read || []
          }
          handleShare={handleShare}
          handleUnshare={handleUnshare}
        />
      </Modal>
    </>
  )
}
