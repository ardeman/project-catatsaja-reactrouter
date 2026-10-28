import { useEffect, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import { LoadingScreen } from '~/components/base/loading-screen'
import { Modal } from '~/components/base/modal'
import { Share } from '~/components/base/share'
import { useHealthLog } from '~/components/pages/health'
import { useAuthUser } from '~/lib/hooks/use-auth-user'
import { useGetHealthLog } from '~/lib/hooks/use-get-health-log'
import { useLogout } from '~/lib/hooks/use-logout'
import { useShareHealthLog } from '~/lib/hooks/use-share-health-log'
import { toast } from '~/lib/hooks/use-toast'
import { useUpdateArchive } from '~/lib/hooks/use-update-archive'
import {
  THandleDeletePermission,
  THandleSetPermission,
} from '~/lib/types/common'
import { THealthLogPermissionRequest } from '~/lib/types/health'

import { Form } from './form'

export const Content = () => {
  const { health: healthLog } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: healthLogData, isLoading: healthLogIsLoading } =
    useGetHealthLog(healthLog === 'create' ? undefined : healthLog)
  const { data: user, isLoading: userIsLoading } = useAuthUser()
  const { mutate: mutateLogout } = useLogout()
  const {
    setSelectedHealthLog,
    openConfirmation,
    setOpenConfirmation,
    openShare,
    setOpenShare,
    selectedConfirmation,
    handleConfirm,
    selectedHealthLog,
  } = useHealthLog()
  const { mutate: mutateShare } = useShareHealthLog()
  const { mutate: archive } = useUpdateArchive()

  useEffect(() => {
    if (healthLogData) setSelectedHealthLog(healthLogData)
  }, [healthLogData, setSelectedHealthLog])

  const previousLoading = useRef(healthLogIsLoading)

  useEffect(() => {
    const hasFinishedLoading = previousLoading.current && !healthLogIsLoading
    previousLoading.current = healthLogIsLoading
    if (!hasFinishedLoading || healthLog === 'create' || healthLogData) {
      return
    }

    if (!user && !userIsLoading) {
      mutateLogout()
      return
    }

    if (
      ['delete', 'unlink'].includes(selectedConfirmation?.kind || '') &&
      selectedConfirmation?.detail.id === healthLog
    ) {
      navigate('/health', { replace: true })
      return
    }

    toast({
      variant: 'destructive',
      description: t('health.toast.notFound'),
    })
    navigate('/health', { replace: true })
  }, [
    healthLogData,
    healthLogIsLoading,
    healthLog,
    navigate,
    t,
    user,
    userIsLoading,
    mutateLogout,
    selectedConfirmation,
  ])

  if (healthLogIsLoading)
    return (
      <LoadingScreen
        isLoading
        classname="min-h-fit flex-1"
      />
    )

  const handleShare = (parameters: THandleSetPermission) => {
    const data = {
      ...parameters,
      healthLog: healthLogData,
    } as THealthLogPermissionRequest
    return mutateShare(data)
  }

  const handleUnshare = (parameters: Pick<THandleDeletePermission, 'uid'>) => {
    const data = {
      ...parameters,
      permission: 'delete',
      healthLog: healthLogData,
    } as THealthLogPermissionRequest
    mutateShare(data)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {/* A fresh form per log, so values typed in one never carry over
          into the next (after creating one). */}
      <Form
        key={healthLog}
        healthLog={healthLogData}
      />
      <Modal
        open={openConfirmation}
        setOpen={setOpenConfirmation}
        handleConfirm={handleConfirm}
        confirmLabel={t(`actions.${selectedConfirmation?.kind}`)}
        variant="destructive"
        {...(selectedConfirmation &&
          !selectedConfirmation.detail.isArchived && {
            description: t('form.archiveInstead.description'),
            secondaryLabel: t('form.archiveInstead.action'),
            handleSecondary: () => {
              setOpenConfirmation(false)
              void archive('healthLogs', selectedConfirmation.detail.id, true)
            },
          })}
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
          write={healthLogData?.permissions?.write || []}
          read={healthLogData?.permissions?.read || []}
          invited={healthLogData?.invites}
          handleShare={handleShare}
          handleUnshare={handleUnshare}
        />
      </Modal>
    </div>
  )
}
