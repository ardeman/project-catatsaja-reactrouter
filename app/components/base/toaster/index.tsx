import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '~/components/ui/toast'
import { useToast } from '~/lib/hooks/use-toast'

// shadcn/ui's Toaster, with toasts kept above the phone bottom bar on pages
// that show it (`--toast-bottom`, app/styles/tailwind.css).
export const Toaster = () => {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...properties }) => (
        <Toast
          key={id}
          {...properties}
        >
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport className="max-md:bottom-(--toast-bottom)" />
    </ToastProvider>
  )
}
