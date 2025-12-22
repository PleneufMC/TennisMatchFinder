'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';

interface ToasterProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}

function Toaster({ position = 'bottom-right' }: ToasterProps) {
  return (
    <SonnerToaster
      position={position}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          success: 'group-[.toaster]:bg-green-50 group-[.toaster]:text-green-900 group-[.toaster]:border-green-200 dark:group-[.toaster]:bg-green-900/20 dark:group-[.toaster]:text-green-100 dark:group-[.toaster]:border-green-800',
          error: 'group-[.toaster]:bg-red-50 group-[.toaster]:text-red-900 group-[.toaster]:border-red-200 dark:group-[.toaster]:bg-red-900/20 dark:group-[.toaster]:text-red-100 dark:group-[.toaster]:border-red-800',
          warning: 'group-[.toaster]:bg-yellow-50 group-[.toaster]:text-yellow-900 group-[.toaster]:border-yellow-200 dark:group-[.toaster]:bg-yellow-900/20 dark:group-[.toaster]:text-yellow-100 dark:group-[.toaster]:border-yellow-800',
          info: 'group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-900 group-[.toaster]:border-blue-200 dark:group-[.toaster]:bg-blue-900/20 dark:group-[.toaster]:text-blue-100 dark:group-[.toaster]:border-blue-800',
        },
      }}
      expand
      richColors
    />
  );
}

// Export toast utilities
export { Toaster, toast };
