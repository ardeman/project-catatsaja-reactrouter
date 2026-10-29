import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '~/components/ui/toast'
import { useToast } from '~/lib/hooks/use-toast'
import { cn } from '~/lib/utils/shadcn'

// shadcn/ui's Toaster, with toasts kept above the phone bottom bar on pages
// that show it (`--toast-bottom`, app/styles/tailwind.css). Plain toasts are
// liquid glass; the variant's own background and blur would cover it. Error
// toasts are glass too, with red text: the variant's light text on its faint
// red tint is hard to read.
const glassToast =
  'glass-surface rounded-2xl bg-(--glass-tint) backdrop-blur-xl backdrop-saturate-180 supports-backdrop-filter:bg-(--glass-tint)'
const errorToast = 'border-destructive/60 font-medium text-destructive-text'
export const Toaster = () => {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(
        ({ id, title, description, action, className, ...properties }) => (
          <Toast
            key={id}
            {...properties}
            className={cn(
              glassToast,
              properties.variant === 'destructive' && errorToast,
              className,
            )}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="group-[.destructive]:text-destructive-text/60 hover:group-[.destructive]:text-destructive-text" />
          </Toast>
        ),
      )}
      <ToastViewport className="max-md:bottom-(--toast-bottom)" />
    </ToastProvider>
  )
}
