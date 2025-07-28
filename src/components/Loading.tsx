// components/Loading.tsx
import { Loader2 } from 'lucide-react'

type LoadingProps = {
  message?: string
  fullScreen?: boolean
}

export default function Loading({ message = 'Cargando...', fullScreen = true }: LoadingProps) {
  const containerClasses = fullScreen 
    ? 'min-h-screen flex items-center justify-center bg-gray-50'
    : 'flex items-center justify-center p-8'

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin mb-4" />
        <p className="text-gray-600 font-medium">{message}</p>
        <p className="text-sm text-gray-400 mt-2">Por favor espera un momento</p>
      </div>
    </div>
  )
}