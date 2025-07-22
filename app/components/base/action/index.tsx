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
  } = properties
  const buttonClassName =
    'ring-offset-background focus:ring-ring bg-accent text-muted-foreground h-5 w-full rounded-full p-0 opacity-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none group-hover/card:opacity-100 group-[.is-shown]/form:opacity-100 sm:opacity-0'

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
              ? '[&_svg]:text-primary [&_svg]:hover:text-foreground'
              : '[&_svg]:hover:text-primary',
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
