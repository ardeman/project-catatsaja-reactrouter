import { useTranslation } from 'react-i18next'
import { useMediaQuery } from 'usehooks-ts'

import { Button } from '~/components/base'
import {
  Dialog as UIDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer as UIDrawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '~/components/ui'
import { cn } from '~/lib/utils'

import { TParams, TProps } from './type'

export const Modal = (props: TProps) => {
  const {
    open,
    setOpen,
    children,
    title,
    description,
    onClose,
    handleConfirm,
    variant = 'default',
  } = props
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const handleClose = () => {
    setOpen(false)
    if (onClose) {
      onClose() // Call onClose when the modal is closed
    }
  }

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        setOpen={setOpen}
        title={title}
        description={description}
        handleClose={handleClose}
        handleConfirm={handleConfirm}
        variant={variant}
      >
        {children}
      </Dialog>
    )
  }

  return (
    <Drawer
      open={open}
      setOpen={setOpen}
      title={title}
      description={description}
      handleClose={handleClose}
      handleConfirm={handleConfirm}
      variant={variant}
    >
      {children}
    </Drawer>
  )
}

const Dialog = (params: TParams) => {
  const {
    open,
    setOpen,
    children,
    title,
    description,
    handleClose,
    handleConfirm,
    variant,
  } = params
  const { t } = useTranslation()
  return (
    <UIDialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) handleClose() // Trigger handleClose when closing
      }}
    >
      <DialogContent className="max-h-dvh overflow-y-auto rounded-lg">
        <DialogHeader className={title || description ? '' : 'hidden'}>
          <DialogTitle className={title ? '' : 'hidden'}>{title}</DialogTitle>
          <DialogDescription className={description ? '' : 'hidden'}>
            {description}
          </DialogDescription>
        </DialogHeader>
        {children}
        {handleConfirm && (
          <DialogFooter>
            <Button
              variant={variant}
              onClick={handleConfirm}
            >
              {t('form.confirm')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </UIDialog>
  )
}

const Drawer = (params: TParams) => {
  const {
    open,
    setOpen,
    children,
    title,
    description,
    handleClose,
    handleConfirm,
    variant,
  } = params
  return (
    <UIDrawer
      repositionInputs={false}
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) handleClose() // Trigger handleClose when closing
      }}
    >
      <DrawerContent className="h-fit max-h-dvh rounded-t-lg">
        <div className="overflow-y-auto">
          <DrawerHeader
            className={cn(title || description ? '' : 'hidden', 'text-left')}
          >
            <DrawerTitle className={title ? '' : 'hidden'}>{title}</DrawerTitle>
            <DrawerDescription className={description ? '' : 'hidden'}>
              {description}
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-2 p-4">{children}</div>
          <DrawerFooter className="pb-6 pt-2">
            {handleConfirm && (
              <Button
                variant={variant}
                onClick={handleConfirm}
              >
                Confirm
              </Button>
            )}
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </UIDrawer>
  )
}
