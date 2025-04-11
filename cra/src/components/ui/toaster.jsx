// src/components/ui/toaster.jsx
import {
    Toast,
    ToastClose,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
  } from "./toast"
  import { useToast } from "./use-toast"
  
  export function Toaster() {
    const { toasts, dismissToast } = useToast()
  
    return (
      <ToastProvider>
        {toasts.map(({ id, title, description, action, variant }) => (
          <Toast key={id} variant={variant} onOpenChange={() => dismissToast(id)}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    )
  }