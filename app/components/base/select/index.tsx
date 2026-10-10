import { ComponentProps } from 'react'

import { SelectContent as UISelectContent } from '~/components/ui/select'
import { cn } from '~/lib/utils/shadcn'

export {
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

export const SelectContent = (
  properties: ComponentProps<typeof UISelectContent>,
) => {
  const { className, ...rest } = properties
  return (
    <UISelectContent
      {...rest}
      className={cn('glass-surface', className)}
    />
  )
}
