import { HeartPulse } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import { Collection } from '~/components/base/collection'
import { Modal } from '~/components/base/modal'
import { Share } from '~/components/base/share'
import { useGetHealthLogs } from '~/lib/hooks/use-get-health-logs'
import { useShareHealthLog } from '~/lib/hooks/use-share-health-log'
import {
  THandleDeletePermission,
  THandleSetPermission,
} from '~/lib/types/common'

import { Card } from './card'
import { useHealthLog } from './context'

export const List = () => {
  const { t } = useTranslation()
  const {
    openConfirmation,
    setOpenConfirmation,
    openShare,
    setOpenShare,
    selectedConfirmation,
    handleConfirm,
    selectedHealthLog,
    handleCreateHealthLog,
  } = useHealthLog()
  const { data: healthLogsData, isLoading } = useGetHealthLogs()
  const { mutate: mutateShare } = useShareHealthLog()
  const sharedHealthLog = healthLogsData?.find(
    (item) => item.id === selectedHealthLog?.id,
  )

  const handleShare = (parameters: THandleSetPermission) => {
    if (!sharedHealthLog) return
    mutateShare({ ...parameters, healthLog: sharedHealthLog })
  }

  const handleUnshare = (parameters: Pick<THandleDeletePermission, 'uid'>) => {
    if (!sharedHealthLog) return
    mutateShare({
      ...parameters,
      permission: 'delete',
      healthLog: sharedHealthLog,
    })
  }

  return (
    <>
      <Collection
        items={healthLogsData}
        isLoading={isLoading}
        layout="masonry"
        icon={HeartPulse}
        emptyTitle={t('health.empty.title')}
        emptyDescription={t('health.empty.description')}
        createLabel={t('health.new')}
        onCreate={handleCreateHealthLog}
        getSearchText={(healthLog) =>
          [
            healthLog.name,
            ...(healthLog.content || []).map((entry) => entry.note ?? ''),
          ].join(' ')
        }
        renderCard={(healthLog, className) => (
          <Card
            healthLog={healthLog}
            key={healthLog.id}
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
            values={{ item: t('health.title') }}
            components={{ span: <span className="text-primary" /> }}
          />
        }
      >
        {selectedConfirmation?.detail.name && (
          <p className="text-xl">{selectedConfirmation.detail.name}</p>
        )}
        <p className="text-muted-foreground">
          {t('health.entries', {
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
            values={{ item: t('health.title') }}
            components={{ span: <span className="text-primary" /> }}
          />
        }
      >
        <Share
          path={`/health/${selectedHealthLog?.id}`}
          write={sharedHealthLog?.permissions?.write || []}
          read={sharedHealthLog?.permissions?.read || []}
          handleShare={handleShare}
          handleUnshare={handleUnshare}
        />
      </Modal>
    </>
  )
}
