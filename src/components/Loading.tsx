// components/Loading.tsx - Enhanced Loading Component
import { Dumbbell, Loader2 } from 'lucide-react'

type LoadingProps = {
  message?: string
  fullScreen?: boolean
  variant?: 'default' | 'minimal' | 'branded'
}

export default function Loading({ 
  message = 'Cargando...', 
  fullScreen = true,
  variant = 'default'
}: LoadingProps) {
  const containerClasses = fullScreen 
    ? 'min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 p-4'
    : 'flex items-center justify-center p-8'

  if (variant === 'minimal') {
    return (
      <div className={containerClasses}>
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
      </div>
    )
  }

  if (variant === 'branded') {
    return (
      <div className={containerClasses}>
        <div className="text-center max-w-sm mx-auto">
          {/* Animated Logo */}
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
              <Dumbbell className="w-10 h-10 text-white animate-pulse" />
            </div>
            <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mx-auto animate-ping opacity-20"></div>
          </div>
          
          {/* Brand Name */}
          <h2 className="text-2xl font-bold text-gradient mb-3">TrainerApp</h2>
          
          {/* Loading Indicator */}
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce delay-200"></div>
          </div>
          
          <p className="text-gray-600 font-medium">{message}</p>
          <p className="text-sm text-gray-400 mt-2">Por favor espera un momento</p>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={containerClasses}>
      <div className="text-center max-w-md mx-auto">
        {/* Loading Spinner */}
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-red-100 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-red-600 rounded-full animate-spin mx-auto"></div>
        </div>
        
        {/* Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
            <p className="text-gray-900 font-semibold">{message}</p>
          </div>
          <p className="text-sm text-gray-500">Por favor espera un momento</p>
        </div>
      </div>
    </div>
  )
}