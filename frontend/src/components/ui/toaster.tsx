import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, className, ...props }, index) {
        // index 0 is the newest toast (top card).
        // Cards deeper in the stack get offset and scaled down.
        const offsetY = index * 12
        const scale = 1 - index * 0.04
        const zIndex = toasts.length - index
        const isFront = index === 0

        return (
          <Toast
            key={id}
            className={cn(
              // Explicit transition ensures smooth promotion when top toast exits
              'transition-all duration-300 ease-out',
              !isFront && 'select-none',
              className
            )}
            style={{
              zIndex,
              transform: `translateY(${offsetY}px) scale(${scale})`,
              opacity: index >= 3 ? 0 : 1 - index * 0.12,
              pointerEvents: isFront ? 'auto' : 'none',
            }}
            {...props}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className={cn(!isFront && 'opacity-0 pointer-events-none')} />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}