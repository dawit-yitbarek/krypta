import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    // Changed flex flex-col to grid grid-cols-1
    className={cn(
      'fixed top-4 z-[100] grid w-full max-h-screen p-2 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[360px]',
      className,
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  // Added col-start-1 row-start-1 and origin-top for stack scaling
  'group col-start-1 row-start-1 pointer-events-auto relative flex w-full items-center justify-between space-x-3 overflow-hidden rounded-lg border p-3 pr-7 shadow-xl transition-all duration-300 ease-out origin-top data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full',
  {
    variants: {
      variant: {
        default:
          'border-[#27272a] bg-[#18181b]/95 text-[#e4e4e7] backdrop-blur-md',
        destructive:
          'border-[#f43f5e]/30 bg-[#18181b]/95 text-[#e4e4e7] backdrop-blur-md shadow-[0_4px_20px_rgba(244,63,94,0.15)]',
        warning:
          'border-[#f59e0b]/30 bg-[#18181b]/95 text-[#e4e4e7] backdrop-blur-md shadow-[0_4px_20px_rgba(245,158,11,0.15)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants>
>(({ className, variant, style, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      style={style}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-[#27272a] bg-[#27272a]/60 px-2.5 text-[11px] font-medium text-[#e4e4e7] transition-all hover:bg-[#3f3f46] hover:text-white hover:border-[#52525b] focus:outline-none focus:ring-1 focus:ring-[#10b981] disabled:pointer-events-none disabled:opacity-50 active:scale-95',
      className,
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-0.5 text-[#a1a1aa] opacity-60 transition-opacity hover:text-[#e4e4e7] hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-[#10b981]',
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-[12px] font-semibold leading-tight tracking-tight', className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-[11px] text-[#a1a1aa] leading-normal', className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionProps = React.ComponentPropsWithoutRef<typeof ToastAction>
type ToastActionElement = React.ReactElement<ToastActionProps>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}