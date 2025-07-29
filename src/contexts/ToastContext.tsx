// contexts/ToastContext.tsx
'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType, options?: Partial<Toast>) => string
  removeToast: (id: string) => void
  clearAll: () => void
  success: (message: string, options?: Partial<Toast>) => string
  error: (message: string, options?: Partial<Toast>) => string
  warning: (message: string, options?: Partial<Toast>) => string
  info: (message: string, options?: Partial<Toast>) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Componente individual de Toast
const ToastItem: React.FC<{
  toast: Toast
  onRemove: (id: string) => void
}> = ({ toast, onRemove }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const iconStyles = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  }

  const Icon = icons[toast.type]

  return (
    <div
      className={`
        relative p-4 rounded-lg border shadow-lg max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        animate-in slide-in-from-right-full
        ${styles[toast.type]}
      `}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconStyles[toast.type]}`} />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">
            {toast.message}
          </p>
          
          {toast.action && (
            <Button
              variant="outline"
              size="sm"
              onClick={toast.action.onClick}
              className="mt-2 h-8 text-xs"
            >
              {toast.action.label}
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(toast.id)}
          className="p-1 h-6 w-6 hover:bg-black/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// Contenedor de Toasts
const ToastContainer: React.FC<{
  toasts: Toast[]
  onRemove: (id: string) => void
}> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-h-screen overflow-y-auto">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

// Provider de Toast
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((
    message: string,
    type: ToastType = 'info',
    options: Partial<Toast> = {}
  ): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const duration = options.duration ?? (type === 'error' ? 8000 : 5000)

    const newToast: Toast = {
      id,
      message,
      type,
      duration,
      ...options
    }

    setToasts(prev => [...prev, newToast])

    // Auto-remove después del duration especificado
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  // Métodos de conveniencia
  const success = useCallback((message: string, options: Partial<Toast> = {}) => {
    return addToast(message, 'success', options)
  }, [addToast])

  const error = useCallback((message: string, options: Partial<Toast> = {}) => {
    return addToast(message, 'error', options)
  }, [addToast])

  const warning = useCallback((message: string, options: Partial<Toast> = {}) => {
    return addToast(message, 'warning', options)
  }, [addToast])

  const info = useCallback((message: string, options: Partial<Toast> = {}) => {
    return addToast(message, 'info', options)
  }, [addToast])

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}