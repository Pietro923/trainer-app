// app/page.tsx - Enhanced Login Page
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoginForm from '@/components/LoginForm'
import Loading from '@/components/Loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell, TrendingUp, Users, Zap } from 'lucide-react'

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
              onClick={() => {
                router.push('/')
                window.location.reload()
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium py-3 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
            >
              Volver al Login
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-orange-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-gradient-to-br from-orange-200/30 to-orange-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-gradient-to-br from-gray-200/30 to-gray-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
      </div>

      <div className="relative w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-8 animate-fade-in">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">
                  TrainerApp
                </h1>
                <p className="text-gray-600">
                  Plataforma Profesional de Entrenamiento
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                Transforma tu
                <span className="text-gradient block">
                  entrenamiento
                </span>
                con tecnología
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                La plataforma más avanzada para entrenadores y clientes. 
                Gestiona rutinas, planes alimenticios y progreso desde una sola aplicación.
              </p>
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Seguimiento Avanzado</h3>
                  <p className="text-gray-600 text-sm">Monitorea el progreso en tiempo real</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Gestión de Clientes</h3>
                  <p className="text-gray-600 text-sm">Administra múltiples clientes fácilmente</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="animate-slide-up">
          <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/90 backdrop-blur-lg">
            <CardHeader className="text-center pb-6">
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center justify-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-gradient">TrainerApp</h1>
                  <p className="text-gray-600 text-sm">Plataforma de Entrenamiento</p>
                </div>
              </div>
              
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Bienvenido de vuelta
              </CardTitle>
              <CardDescription className="text-gray-600">
                Accede a tu plataforma de entrenamiento
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <LoginForm />
            </CardContent>
          </Card>
          
          {/* Bottom CTA for mobile */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-gray-600 text-sm">
              ¿Primera vez aquí? Contacta a tu entrenador para obtener acceso
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}