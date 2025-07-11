import { ArrowLeft, Eye, Forward, Pin, Save, Trash, Users } from 'lucide-react'

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
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}
      {isCreate && (
        <Button
          variant="outline"
          containerClassName="flex-1 flex items-center"
          className={buttonClassName}
          type="submit"
          isLoading={isLoading}
        >
          <Save className="h-4 w-4" />
          <span className="sr-only">Submit</span>
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
          className={cn(buttonClassName, 'hover:text-red-500')}
        >
          <Trash className="h-4 w-4" />
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
          className={cn(buttonClassName, 'hover:text-red-500')}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {isEditable && handleShare && (
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
              <Users className="h-4 w-4" />
              <span className="text-xs">{sharedCount}</span>
            </>
          ) : (
            <Forward className="h-4 w-4" />
          )}
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
              ? 'text-yellow-500 hover:text-muted-foreground sm:opacity-100'
              : 'text-muted-foreground hover:text-yellow-500 sm:opacity-0',
            'group/button',
          )}
        >
          <Pin
            className={cn(
              isPinned
                ? 'rotate-45 group-hover/button:rotate-0'
                : 'group-hover/button:rotate-45',
              'h-4 w-4 transition-all duration-300',
            )}
          />
        </Button>
      )}
    </div>
  )
}
