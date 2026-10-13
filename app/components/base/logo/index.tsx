import { logos } from '~/lib/constants/metadata'
import { cn } from '~/lib/utils/shadcn'

// The app's logo in the app's theme (the `dark` class, set before the first
// paint), so prerendered pages show the right one at once. Decorative: the
// app's name is always beside it, as text or for screen readers.
export const Logo = ({ className }: { className?: string }) => (
  <>
    <img
      src={logos.light}
      alt=""
      className={cn('dark:hidden', className)}
    />
    <img
      src={logos.dark}
      alt=""
      className={cn('not-dark:hidden', className)}
    />
  </>
)
