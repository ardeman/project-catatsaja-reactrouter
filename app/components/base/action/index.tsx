import {
  ArrowLeft,
  Eye,
  Forward,
  Pin,
  Save,
  Trash,
  Users,
  ListChecks,
} from 'lucide-react'

import { Button } from '~/components/base/button'
import { TActionProperties } from '~/lib/types/common'
import { cn } from '~/lib/utils/shadcn'

export const Action = (properties: TActionProperties) => {
  const {
    isOwner,
    isEditable,
    isPinned,
    className,
    handleDelete,
    handleUnlink,
    handleShare,
    handlePin,
    sharedCount,
    handleBack,
    isCreate = false,
    isLoading = false,
    disabled = false,
    handleToggleCheckAll,
    checkedAll,
    buttonClassName: buttonClassNameProperty,
  } = properties
  const buttonClassName = cn(
    'h-5 w-full rounded-full bg-accent p-0 text-muted-foreground opacity-100 ring-offset-background transition-all duration-300 group-hover/card:opacity-100 group-[.is-shown]/form:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none sm:opacity-0',
    buttonClassNameProperty,
  )

  return (
    <div className={cn(className, 'flex justify-between gap-1')}>
      {handleBack && (
        <Button
          variant="outline"
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
          <Eye />
        </Button>
      )}
      {isOwner && isEditable && handleShare && (
        <Button
          variant="outline"
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
          isLoading={isLoading}
          disabled={isLoading || disabled}
        >
          <Save />
          <span className="sr-only">Submit</span>
        </Button>
      )}
      {handlePin && (
        <Button
          variant="outline"
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
