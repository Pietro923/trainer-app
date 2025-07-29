// components/RouteGuard.tsx
import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PageLoading } from '@/components/PageLoading'

interface RouteGuardProps {
  children: ReactNode
  requiredRole?: 'trainer' | 'client'
  requireActive?: boolean
  fallback?: ReactNode
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredRole,
  requireActive = true,
  fallback
}) => {
  const { user, profile, loading, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!initialized || loading) return

    if (!user || !profile) {
      router.push('/')
      return
    }

    if (requiredRole && profile.role !== requiredRole) {
      const redirectPath = profile.role === 'trainer' ? '/trainer/dashboard' : '/client/dashboard'
      router.push(redirectPath)
      return
    }

    if (requireActive && !profile.active) {
      router.push('/')
      return
    }
  }, [user, profile, loading, initialized, requiredRole, requireActive, router])

  if (!initialized || loading) {
    return <PageLoading message="Verificando permisos..." />
  }

  if (!user || !profile) {
    return fallback || <PageLoading message="Redirigiendo..." />
  }

  if (requiredRole && profile.role !== requiredRole) {
    return fallback || <PageLoading message="Redirigiendo..." />
  }

  if (requireActive && !profile.active) {
    return fallback || <PageLoading message="Cuenta inactiva..." />
  }

  return <>{children}</>
}