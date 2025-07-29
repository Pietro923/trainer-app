// components/PageLoading.tsx
interface PageLoadingProps {
  message?: string
}

export const PageLoading = ({ message = "Cargando..." }: PageLoadingProps) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600 font-medium">{message}</p>
      <p className="text-sm text-gray-400 mt-2">Por favor espera un momento</p>
    </div>
  </div>
)