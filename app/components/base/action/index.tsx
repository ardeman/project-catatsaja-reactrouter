import { Eye, Forward, Pin, Trash } from 'lucide-react'

import { Button } from '~/components/base'
import { TActionProps } from '~/lib/types'
import { cn } from '~/lib/utils'

export const Action = (props: TActionProps) => {
  const {
    isOwner,
    isEditable,
    isPinned,
    className,
    handleDelete,
    handleUnlink,
    handleShare,
    handlePin,
  } = props
  const buttonClassName =
    'ring-offset-background focus:ring-ring bg-accent text-muted-foreground h-5 w-full rounded-full p-0 opacity-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none group-hover/card:opacity-100 group-[.is-shown]/form:opacity-100 sm:opacity-0'

  return (
    <div className={cn(className, 'flex justify-between gap-1')}>
      {isOwner ? (
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
      ) : (
        <Button
          variant="outline"
          onClick={handleUnlink}
          containerClassName="flex-1 flex items-center"
          className={cn(buttonClassName, 'hover:text-red-500')}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {isEditable && (
        <Button
          variant="outline"
          onClick={handleShare}
          containerClassName="flex-1 flex items-center"
          className={buttonClassName}
        >
          <Forward className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="outline"
        onClick={handlePin}
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
    </div>
  )
}
