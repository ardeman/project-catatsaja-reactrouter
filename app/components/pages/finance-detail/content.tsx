import { useEffect, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import { LoadingScreen } from '~/components/base/loading-screen'
import { Modal } from '~/components/base/modal'
import { Share } from '~/components/base/share'
import { useFinance } from '~/components/pages/finances'
import { useAuthUser } from '~/lib/hooks/use-auth-user'
import { useGetFinance } from '~/lib/hooks/use-get-finance'
import { useLogout } from '~/lib/hooks/use-logout'
import { useShareFinance } from '~/lib/hooks/use-share-finance'
import { toast } from '~/lib/hooks/use-toast'
import {
  THandleDeletePermission,
  THandleSetPermission,
} from '~/lib/types/common'
import { TFinancePermissionRequest } from '~/lib/types/finance'

import { Form } from './book-form'

export const Content = () => {
  const { finance } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: financeData, isLoading: financeIsLoading } = useGetFinance(
    finance === 'create' ? undefined : finance,
  )
  const { data: user, isLoading: userIsLoading } = useAuthUser()
  const { mutate: mutateLogout } = useLogout()
  const {
    setSelectedFinance,
    openConfirmation,
    setOpenConfirmation,
    openShare,
    setOpenShare,
    selectedConfirmation,
    handleConfirm,
    selectedFinance,
  } = useFinance()
  const { mutate: mutateShare } = useShareFinance()

  useEffect(() => {
    if (financeData) setSelectedFinance(financeData)
  }, [financeData, setSelectedFinance])

  const previousLoading = useRef(financeIsLoading)

  useEffect(() => {
    const hasFinishedLoading = previousLoading.current && !financeIsLoading
    previousLoading.current = financeIsLoading
    if (!hasFinishedLoading) return

    if (finance === 'create' || financeData) {
      return
    }

    if (!user && !userIsLoading) {
      mutateLogout()
      return
    }

    if (
      ['delete', 'unlink'].includes(selectedConfirmation?.kind || '') &&
      selectedConfirmation?.detail.id === finance
    ) {
      navigate('/finances', { replace: true })
      return
    }

    toast({
      variant: 'destructive',
      description: t('finances.toast.notFound'),
    })
    navigate('/finances', { replace: true })
  }, [
    financeData,
    financeIsLoading,
    finance,
    navigate,
    t,
    user,
    userIsLoading,
    mutateLogout,
    selectedConfirmation,
  ])

  const handleShare = (parameters: THandleSetPermission) => {
    const data = {
      ...parameters,
      finance: financeData,
    } as TFinancePermissionRequest
    mutateShare(data)
  }

  const handleUnshare = (parameters: Pick<THandleDeletePermission, 'uid'>) => {
    const data = {
      ...parameters,
      permission: 'delete',
      finance: financeData,
    } as TFinancePermissionRequest
    mutateShare(data)
  }

  if (financeIsLoading)
    return (
      <LoadingScreen
        isLoading
        classname="min-h-fit flex-1"
      />
    )

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Form finance={financeData} />
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
          write={financeData?.permissions?.write || []}
          read={financeData?.permissions?.read || []}
          handleShare={handleShare}
          handleUnshare={handleUnshare}
        />
      </Modal>
    </div>
  )
}
