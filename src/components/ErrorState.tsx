// components/ErrorState.tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export const ErrorState = ({
  title = "Error al cargar los datos",
  description = "Hubo un problema al cargar la información. Por favor, inténtalo de nuevo.",
  onRetry,
  className = ""
}: ErrorStateProps) => (
  <Card className={`text-center py-12 border-orange-200 bg-orange-50 ${className}`}>
    <CardContent>
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-orange-900 mb-2">
        {title}
      </h3>
      <p className="text-orange-700 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="border-orange-300 text-orange-700 hover:bg-orange-100">
          Intentar de nuevo
        </Button>
      )}
    </CardContent>
  </Card>
)