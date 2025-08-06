'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function SuspendedAccount() {
  const { signOut } = useAuth()

  const handleBackToLogin = async () => {
    try {
      // Cerrar sesión de Supabase
      await supabase.auth.signOut()
      
      // Limpiar almacenamiento local
      window.localStorage.clear()
      window.sessionStorage.clear()
      
      // Redireccionar forzadamente
      window.location.href = '/'
      
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      // Fallback: recargar página
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-orange-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-lg animate-scale-in">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Suspendido
          </CardTitle>
          <CardDescription className="text-gray-600">
            Tu cuenta ha sido temporalmente desactivada
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-4">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <p className="text-orange-700 font-medium mb-2">
              🚫 Cuenta Inactiva
            </p>
            <p className="text-orange-600 text-sm">
              Por favor contacta a tu entrenador para reactivar tu acceso.
            </p>
          </div>
          <button 
            onClick={handleBackToLogin}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium py-3 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
          >
            Volver al Login
          </button>
        </CardContent>
      </Card>
    </div>
  )
}