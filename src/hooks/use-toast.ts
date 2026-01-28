'use client';

import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

// Simple toast state management
// In a real app, you'd use a toast library like sonner or react-hot-toast
// For now, we'll use browser alerts as a simple fallback

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    // Simple implementation using browser alert
    // In production, replace with a proper toast library
    const prefix = options.variant === 'destructive' ? '❌ ' : '✅ ';
    const message = options.description 
      ? `${options.title}\n\n${options.description}`
      : options.title;
    
    // Use setTimeout to avoid blocking the UI
    setTimeout(() => {
      alert(prefix + message);
    }, 100);
  }, []);

  return { toast };
}
