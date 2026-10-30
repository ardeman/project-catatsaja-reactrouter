import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Calculator,
  Copy,
  EyeOff,
  Forward,
  Pin,
  Redo2,
  Save,
  Trash,
  Undo2,
  Users,
  ListChecks,
  Type,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { CardStylePicker } from '~/components/base/card-style'
import { TActionProperties } from '~/lib/types/common'
import { cn } from '~/lib/utils/shadcn'

// The bar's button style, also used by rows shown under it.
export const actionButtonClassName =
  'h-8 w-full rounded-full bg-accent p-0 text-muted-foreground opacity-100 ring-offset-background transition-all duration-300 group-hover/card:opacity-100 group-[.is-shown]/form:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none sm:h-6 sm:opacity-0'

export const Action = (properties: TActionProperties) => {
  const {
    isOwner,
    isEditable,
    isPinned,
    isArchived,
    handleArchive,
    className,
    handleDelete,
    handleUnlink,
    handleShare,
    handlePin,
    handleDuplicate,
    sharedCount,
    handleBack,
    isCreate = false,
    isLoading = false,
    disabled = false,
    handleToggleCheckAll,
    checkedAll,
    buttonClassName: buttonClassNameProperty,
    formId,
    handleUndo,
    handleRedo,
    canUndo = false,
    canRedo = false,
    handleToggleFormat,
    isFormatting = false,
    handleToggleCalculator,
    isCalculating = false,
    extra,
    cardStyle,
    handleCardStyle,
  } = properties
  const { t } = useTranslation()
  const buttonClassName = cn(actionButtonClassName, buttonClassNameProperty)
  // Deleting (or leaving) asks whether to archive instead, so the bar shows
  // its own archive button only to bring an archived item back.
  const canRemove = isOwner ? !!handleDelete : !!handleUnlink
  const shouldShowArchive = !!handleArchive && (!!isArchived || !canRemove)

  return (
    <div className={cn(className, 'flex justify-between gap-1')}>
      {handleBack && (
        <Button
          variant="outline"
          aria-label={t('actions.back')}
          title={t('actions.back')}
          onClick={(event) => {
            event.stopPropagation()
            handleBack()
          }}
          containerClassName="flex-1 flex items-center"
          className={buttonClassName}
        >
          <ArrowLeft />
        </Button>
      )}
      {isOwner && handleDelete && (
        <Button
          variant="outline"
          aria-label={t('actions.delete')}
          data-guide="delete"
          title={t('actions.delete')}
          onClick={(event) => {
            event.stopPropagation()
            handleDelete()
          }}
          containerClassName="flex-1 flex items-center"
          className={cn(
            buttonClassName,
            'text-destructive hover:bg-destructive',
          )}
        >
          <Trash />
        </Button>
      )}
      {!isOwner && handleUnlink && (
        <Button
          variant="outline"
          aria-label={t('actions.unlink')}
          title={t('actions.unlink')}
          onClick={(event) => {
            event.stopPropagation()
            handleUnlink()
          }}
          containerClassName="flex-1 flex items-center"
          className={cn(
            buttonClassName,
            'text-destructive hover:bg-destructive',
          )}
        >
          <EyeOff />
        </Button>
      )}
      {isOwner && isEditable && handleShare && (
        <Button
          variant="outline"
          data-guide="share"
          aria-label={
            sharedCount
              ? t('actions.sharedWith', { count: sharedCount })
              : t('actions.share')
          }
          title={
            sharedCount
              ? t('actions.sharedWith', { count: sharedCount })
              : t('actions.share')
          }
          onClick={(event) => {
            event.stopPropagation()
            handleShare()
          }}
          containerClassName="flex-1 flex items-center"
          className={buttonClassName}
        >
          {sharedCount ? (
            <>
              <Users />
              <span className="text-xs">{sharedCount}</span>
            </>
          ) : (
            <Forward />
          )}
        </Button>
      )}
      {handleToggleCheckAll && (
        <Button
          variant="outline"
          aria-label={t(checkedAll ? 'actions.uncheckAll' : 'actions.checkAll')}
          data-guide="check-all"
          title={t(checkedAll ? 'actions.uncheckAll' : 'actions.checkAll')}
          onClick={(event) => {
            event.stopPropagation()
            handleToggleCheckAll()
          }}
          containerClassName="flex-1 flex items-center"
          className={cn(
            buttonClassName,
            checkedAll
              ? '[&_svg]:text-primary hover:[&_svg]:text-foreground'
              : 'hover:[&_svg]:text-primary',
          )}
          disabled={typeof checkedAll !== 'boolean'}
        >
          <ListChecks />
        </Button>
      )}
      {isCreate && (
        <Button
          variant="outline"
          containerClassName="flex-1 flex items-center"
          className={buttonClassName}
          type="submit"
          form={formId}
          aria-label={t('actions.save')}
          title={t('actions.save')}
          isLoading={isLoading}
          disabled={isLoading || disabled}
        >
          <Save />
        </Button>
      )}
      {handleUndo && (
        <Button
          variant="outline"
          aria-label={t('actions.undo')}
          data-guide="undo"
          title={t('actions.undo')}
          onClick={(event) => {
            event.stopPropagation()
            handleUndo()
          }}
          containerClassName="flex-1 flex items-center"
          className={buttonClassName}
          disabled={!canUndo}
        >
          <Undo2 />
        </Button>
      )}
      {handleRedo && (
        <Button
          variant="outline"
          aria-label={t('actions.redo')}
          title={t('actions.redo')}
          onClick={(event) => {
            event.stopPropagation()
            handleRedo()
          }}
          containerClassName="flex-1 flex items-center"
          className={buttonClassName}
          disabled={!canRedo}
        >
          <Redo2 />
        </Button>
      )}
      {handleToggleFormat && (
        <Button
          variant="outline"
          aria-label={t('notes.formatting.toggle')}
          data-guide="format"
          title={t('notes.formatting.toggle')}
          aria-pressed={isFormatting}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.stopPropagation()
            handleToggleFormat()
          }}
          containerClassName="flex-1 flex items-center"
          className={cn(buttonClassName, isFormatting && 'text-primary')}
        >
          <Type />
        </Button>
      )}
      {handleToggleCalculator && (
        <Button
          variant="outline"
          aria-label={t('finances.calculator.open')}
          title={t('finances.calculator.open')}
          aria-pressed={isCalculating}
          onClick={(event) => {
            event.stopPropagation()
            handleToggleCalculator()
          }}
          containerClassName="flex-1 flex items-center"
          className={cn(buttonClassName, isCalculating && 'text-primary')}
        >
          <Calculator />
        </Button>
      )}
      {extra && (
        <div className="flex flex-1 items-center">{extra(buttonClassName)}</div>
      )}
      {isEditable && handleCardStyle && (
        <CardStylePicker
          cardStyle={cardStyle}
          onChange={handleCardStyle}
          buttonClassName={buttonClassName}
        />
      )}
      {handleDuplicate && (
        <Button
          variant="outline"
          aria-label={t('actions.duplicate')}
          title={t('actions.duplicate')}
          onClick={(event) => {
            event.stopPropagation()
            handleDuplicate()
          }}
          containerClassName="flex-1 flex items-center"
          className={buttonClassName}
          isLoading={isLoading}
          disabled={isLoading}
        >
          <Copy />
        </Button>
      )}
      {shouldShowArchive && (
        <Button
          variant="outline"
          aria-label={t(isArchived ? 'actions.unarchive' : 'actions.archive')}
          title={t(isArchived ? 'actions.unarchive' : 'actions.archive')}
          aria-pressed={!!isArchived}
          onClick={(event) => {
            event.stopPropagation()
            handleArchive?.()
          }}
          containerClassName="flex-1 flex items-center"
          className={cn(buttonClassName, isArchived && 'text-primary')}
        >
          {isArchived ? <ArchiveRestore /> : <Archive />}
        </Button>
      )}
      {handlePin && (
        <Button
          variant="outline"
          aria-label={t(isPinned ? 'actions.unpin' : 'actions.pin')}
          title={t(isPinned ? 'actions.unpin' : 'actions.pin')}
          aria-pressed={!!isPinned}
          onClick={(event) => {
            event.stopPropagation()
            handlePin()
          }}
          containerClassName="flex-1 flex items-center"
          className={cn(
            buttonClassName,
            isPinned
              ? 'text-primary sm:opacity-100'
              : 'hover:text-primary sm:opacity-0',
            'group/button',
          )}
        >
          <Pin
            className={cn(
              isPinned ? 'rotate-45' : '',
              'transition-all duration-300',
            )}
          />
        </Button>
      )}
    </div>
  )
}
