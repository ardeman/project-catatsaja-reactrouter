import { Info } from 'lucide-react'

import { Button as UIButton } from '~/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'

// A section's explanation behind an info button beside its heading, so it
// takes no room until asked for (a tap, as tooltips don't work on touch).
export const SectionInfo = ({
  label,
  text,
}: {
  label: string
  text: string
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <UIButton
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground"
        aria-label={label}
        title={label}
      >
        <Info className="size-4" />
      </UIButton>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      className="text-sm text-muted-foreground"
    >
      {text}
    </PopoverContent>
  </Popover>
)
