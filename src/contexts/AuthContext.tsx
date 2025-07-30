// contexts/AuthContext.tsx - Versión mejorada y robusta
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import { validateSignIn, validateSignUp, SignInData, SignUpData } from '@/lib/validations'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  signIn: (data: SignInData) => Promise<{ success: boolean; error?: string }>
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  isTrainer: boolean
  isClient: boolean
  isActive: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Cache de perfiles para evitar requests innecesarios
const profileCache = new Map<string, { profile: Profile | null; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    error: null
  })

  const { success: showSuccess, error: showError } = useToast()
  
  // Referencias para evitar race conditions
  const mountedRef = useRef(true)
  const initializingRef = useRef(false)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sessionSubscriptionRef = useRef<any>(null)

  // Función robusta para obtener perfil con cache y retry
  const fetchProfile = useCallback(async (userId: string, retryCount = 0): Promise<Profile | null> => {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1000 // 1 segundo

    try {
      console.log(`[Auth] Fetching profile for user: ${userId}, attempt: ${retryCount + 1}`)
      
      // Verificar cache primero
      const cached = profileCache.get(userId)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('[Auth] Using cached profile')
        return cached.profile
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Si el perfil no existe, intentar crear uno básico
        if (error.code === 'PGRST116') {
          console.log('[Auth] Profile not found, attempting to create...')
          
          const { data: user } = await supabase.auth.getUser()
          if (user.user && user.user.id === userId) {
            const newProfile = {
              id: userId,
              email: user.user.email || null,
              full_name: user.user.user_metadata?.full_name || 'Usuario',
              role: (user.user.user_metadata?.role || 'client') as 'trainer' | 'client',
              active: true
            }

            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert([newProfile])
              .select()
              .single()

            if (createError) {
              throw createError
            }
            
            console.log('[Auth] Profile created successfully')
            // Actualizar cache
            profileCache.set(userId, { profile: createdProfile, timestamp: Date.now() })
            return createdProfile
          }
        }
        throw error
      }

      console.log('[Auth] Profile fetched successfully')
      // Actualizar cache
      profileCache.set(userId, { profile, timestamp: Date.now() })
      return profile

    } catch (error) {
      console.error(`[Auth] Error fetching profile (attempt ${retryCount + 1}):`, error)
      
      // Retry en caso de error de red
      if (retryCount < MAX_RETRIES && 
          (error instanceof Error && 
           (error.message.includes('network') || 
            error.message.includes('timeout') ||
            error.message.includes('fetch')))) {
        
        console.log(`[Auth] Retrying profile fetch in ${RETRY_DELAY}ms...`)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)))
        return fetchProfile(userId, retryCount + 1)
      }
      
      return null
    }
  }, [])

  // Función de inicialización robusta con singleton pattern
  const initializeAuth = useCallback(async () => {
    if (initializingRef.current || state.initialized) {
      console.log('[Auth] Already initializing or initialized, skipping...')
      return
    }
    
    console.log('[Auth] Starting initialization...')
    initializingRef.current = true

    try {
      // Verificar sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('[Auth] Session error:', sessionError)
        throw sessionError
      }

      if (session?.user) {
        console.log('[Auth] Active session found for user:', session.user.id)
        
        // Obtener perfil con retry
        const profile = await fetchProfile(session.user.id)
        
        if (!mountedRef.current) return

        setState({
          user: session.user,
          profile,
          loading: false,
          initialized: true,
          error: null
        })

        console.log('[Auth] Initialization completed with user')
      } else {
        console.log('[Auth] No active session found')
        
        if (!mountedRef.current) return

        setState({
          user: null,
          profile: null,
          loading: false,
          initialized: true,
          error: null
        })
      }
    } catch (error) {
      console.error('[Auth] Initialization error:', error)
      
      if (!mountedRef.current) return

      setState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
        error: error instanceof Error ? error.message : 'Error de inicialización'
      })
    } finally {
      initializingRef.current = false
    }
  }, [fetchProfile, state.initialized])

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (sessionSubscriptionRef.current) {
        sessionSubscriptionRef.current.unsubscribe()
      }
    }
  }, [])

  // Efecto principal de inicialización
  useEffect(() => {
    console.log('[Auth] AuthProvider mounted')
    mountedRef.current = true
    
    // Inicializar solo una vez
    if (!state.initialized && !initializingRef.current) {
      initializeAuth()
    }

    // Configurar listener de cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state changed:', event, session?.user?.id)
        
        if (!mountedRef.current) return

        try {
          // Manejar diferentes eventos
          switch (event) {
            case 'SIGNED_IN':
              if (session?.user) {
                console.log('[Auth] User signed in, fetching profile...')
                const profile = await fetchProfile(session.user.id)
                
                setState(prev => ({
                  ...prev,
                  user: session.user,
                  profile,
                  loading: false,
                  error: null
                }))

                if (profile) {
                  showSuccess(`¡Bienvenido, ${profile.full_name}!`)
                }
              }
              break

            case 'SIGNED_OUT':
              console.log('[Auth] User signed out')
              // Limpiar cache
              profileCache.clear()
              
              setState(prev => ({
                ...prev,
                user: null,
                profile: null,
                loading: false,
                error: null
              }))
              showSuccess('Sesión cerrada correctamente')
              break

            case 'TOKEN_REFRESHED':
              console.log('[Auth] Token refreshed')
              // No hacer nada especial, solo mantener la sesión
              break

            case 'USER_UPDATED':
              if (session?.user) {
                console.log('[Auth] User updated, refreshing profile...')
                const profile = await fetchProfile(session.user.id)
                setState(prev => ({
                  ...prev,
                  user: session.user,
                  profile,
                  error: null
                }))
              }
              break

            default:
              console.log('[Auth] Unhandled auth event:', event)
          }
        } catch (error) {
          console.error('[Auth] Error handling auth state change:', error)
          setState(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Error de autenticación'
          }))
        }
      }
    )

    sessionSubscriptionRef.current = subscription

    return () => {
      console.log('[Auth] AuthProvider unmounting')
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [initializeAuth, fetchProfile, showSuccess])

  // Función de sign in mejorada
  const signIn = useCallback(async (data: SignInData): Promise<{ success: boolean; error?: string }> => {
    console.log('[Auth] Starting sign in process')
    
    const validation = validateSignIn(data)
    if (!validation.success) {
      const firstError = validation.error?.issues?.[0]?.message || 'Datos inválidos'
      showError(firstError)
      return { success: false, error: firstError }
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password
      })

      if (error) {
        throw error
      }

      if (!authData.user) {
        throw new Error('No se pudo iniciar sesión')
      }

      // El estado se actualizará automáticamente via onAuthStateChange
      console.log('[Auth] Sign in successful')
      return { success: true }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión'
      console.error('[Auth] Sign in error:', errorMessage)
      showError(errorMessage)
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }, [showError])

  // Función de sign up mejorada
  const signUp = useCallback(async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    const validation = validateSignUp(data)
    
    if (!validation.success) {
      const firstError = validation.error?.issues?.[0]?.message || 'Datos inválidos'
      showError(firstError)
      return { success: false, error: firstError }
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data: authData, error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          data: {
            full_name: validation.data.fullName,
            role: validation.data.role
          }
        }
      })

      if (error) {
        throw error
      }

      if (!authData.user) {
        throw new Error('No se pudo crear la cuenta')
      }

      showSuccess('Cuenta creada exitosamente. Revisa tu email para confirmar.')
      setState(prev => ({ ...prev, loading: false }))
      return { success: true }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear cuenta'
      showError(errorMessage)
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }, [showError, showSuccess])

  // Función de sign out mejorada
  const signOut = useCallback(async () => {
    try {
      console.log('[Auth] Starting sign out process')
      setState(prev => ({ ...prev, loading: true }))
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Limpiar cache
      profileCache.clear()
      
    } catch (error) {
      console.error('[Auth] Error signing out:', error)
      showError('Error al cerrar sesión')
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [showError])

  // Función para refrescar perfil
  const refreshProfile = useCallback(async () => {
    if (!state.user?.id) return
    
    try {
      console.log('[Auth] Refreshing profile...')
      // Limpiar cache para forzar fetch
      profileCache.delete(state.user.id)
      
      const profile = await fetchProfile(state.user.id)
      setState(prev => ({ ...prev, profile }))
      
    } catch (error) {
      console.error('[Auth] Error refreshing profile:', error)
      showError('Error al actualizar perfil')
    }
  }, [state.user?.id, fetchProfile, showError])

  // Función para actualizar perfil
  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<{ success: boolean; error?: string }> => {
    if (!state.user?.id || !state.profile) {
      return { success: false, error: 'No hay usuario autenticado' }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', state.user.id)
        .select()
        .single()

      if (error) throw error

      // Actualizar cache
      profileCache.set(state.user.id, { profile: data, timestamp: Date.now() })
      
      setState(prev => ({ ...prev, profile: data }))
      showSuccess('Perfil actualizado correctamente')
      return { success: true }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar perfil'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [state.user?.id, state.profile, showSuccess, showError])

  // Función para reset de password
  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error

      showSuccess('Se ha enviado un enlace de recuperación a tu email')
      return { success: true }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar email de recuperación'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [showSuccess, showError])

  // Computed properties
  const isTrainer = state.profile?.role === 'trainer'
  const isClient = state.profile?.role === 'client'
  const isActive = state.profile?.active === true

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateProfile,
    resetPassword,
    isTrainer,
    isClient,
    isActive
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}