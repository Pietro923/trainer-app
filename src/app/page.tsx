// app/page.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoginForm from '@/components/LoginForm'
import Loading from '@/components/Loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Solo redirigir cuando ya tengamos la información completa
    if (!loading && user && profile) {
      if (profile.role === 'trainer') {
        router.push('/trainer/dashboard')
      } else if (profile.role === 'client' && profile.active) {
        router.push('/client/dashboard')
      }
      // Si el cliente está inactivo, no redirigir y mostrar el login
    }
  }, [user, profile, loading, router])

  // Mostrar loading mientras se verifica la sesión
  if (loading) {
    return <Loading message="Verificando sesión..." />
  }

  // Si hay usuario pero está inactivo, mostrar mensaje
  if (user && profile && profile.role === 'client' && !profile.active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-900">Acceso Suspendido</CardTitle>
            <CardDescription>
              Tu cuenta ha sido temporalmente desactivada
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Por favor contacta a tu entrenador para reactivar tu acceso.
            </p>
            <button 
              onClick={() => {
                // Cerrar sesión del usuario inactivo
                router.push('/')
                window.location.reload()
              }}
              className="text-blue-600 hover:underline"
            >
              Volver al login
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Si ya hay usuario y perfil activo, no mostrar nada (se redirigirá)
  if (user && profile && profile.active) {
    return <Loading message="Redirigiendo..." />
  }

  // Mostrar formulario de login
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">💪 Trainer App</CardTitle>
          <CardDescription>
            Accede a tu plataforma de entrenamiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}