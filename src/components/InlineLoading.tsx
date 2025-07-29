// components/InlineLoading.tsx
interface InlineLoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export const InlineLoading = ({ 
  message = "Cargando...", 
  size = 'md' 
}: InlineLoadingProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
      <span className="text-gray-600 text-sm">{message}</span>
    </div>
  )
}