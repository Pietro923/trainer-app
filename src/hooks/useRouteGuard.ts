// hooks/useRouteGuard.ts
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export const useRouteGuard = (requiredRole?: 'trainer' | 'client') => {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Solo verificar cuando ya no está cargando
    if (loading) return

    // Si no hay usuario, redirigir al login
    if (!user) {
      router.push('/')
      return
    }

    // Si se requiere un rol específico y no coincide
    if (requiredRole && profile?.role !== requiredRole) {
      // Si es trainer pero está en página de cliente, redirigir
      if (profile?.role === 'trainer' && requiredRole === 'client') {
        router.push('/trainer/dashboard')
        return
      }
      // Si es cliente pero está en página de trainer, redirigir
      if (profile?.role === 'client' && requiredRole === 'trainer') {
        router.push('/client/dashboard')
        return
      }
    }

    // Si el cliente está inactivo
    if (profile?.role === 'client' && !profile?.active) {
      // Mostrar página de "acceso suspendido" o redirigir
      router.push('/')
      return
    }
  }, [user, profile, loading, router, requiredRole])

  return { user, profile, loading }
}