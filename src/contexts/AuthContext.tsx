// contexts/AuthContext.tsx - Versión simplificada y más robusta
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    error: null
  })

  const { success: showSuccess, error: showError } = useToast()
  const mountedRef = useRef(true)
  const initializingRef = useRef(false)

  // Función simple para obtener perfil
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      console.log('Fetching profile for user:', userId)
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.log('Profile fetch error:', error)
        
        // Si el perfil no existe, crear uno básico
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating basic profile')
          
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
              console.error('Error creating profile:', createError)
              return null
            }
            
            console.log('Profile created successfully:', createdProfile)
            return createdProfile
          }
        }
        return null
      }

      console.log('Profile fetched successfully:', profile)
      return profile
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      return null
    }
  }, [])

  // Función simple de inicialización
  const initializeAuth = useCallback(async () => {
    if (initializingRef.current || state.initialized) return
    
    console.log('Initializing auth...')
    initializingRef.current = true

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session error:', error)
        setState({
          user: null,
          profile: null,
          loading: false,
          initialized: true,
          error: error.message
        })
        return
      }

      if (session?.user) {
        console.log('User session found:', session.user.id)
        const profile = await fetchProfile(session.user.id)
        setState({
          user: session.user,
          profile,
          loading: false,
          initialized: true,
          error: null
        })
      } else {
        console.log('No user session found')
        setState({
          user: null,
          profile: null,
          loading: false,
          initialized: true,
          error: null
        })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
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
  }, [fetchProfile])

  // Efecto principal (solo se ejecuta una vez)
  useEffect(() => {
    console.log('AuthProvider mounted')
    mountedRef.current = true
    
    // Inicializar solo si no se ha hecho antes
    if (!state.initialized && !initializingRef.current) {
      initializeAuth()
    }

    // Listener de cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (!mountedRef.current) return

        try {
          if (session?.user && event !== 'TOKEN_REFRESHED') {
            const profile = await fetchProfile(session.user.id)
            setState(prev => ({
              ...prev,
              user: session.user,
              profile,
              loading: false,
              error: null
            }))

            if (event === 'SIGNED_IN' && profile) {
              showSuccess(`¡Bienvenido, ${profile.full_name}!`)
            }
          } else if (event === 'SIGNED_OUT') {
            setState(prev => ({
              ...prev,
              user: null,
              profile: null,
              loading: false,
              error: null
            }))
            showSuccess('Sesión cerrada correctamente')
          }
        } catch (error) {
          console.error('Error in auth state change:', error)
        }
      }
    )

    return () => {
      console.log('AuthProvider unmounting')
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, []) // Array de dependencias vacío - solo se ejecuta una vez

  // Funciones de autenticación (simplificadas)
  const signIn = useCallback(async (data: SignInData): Promise<{ success: boolean; error?: string }> => {
    console.log('=== SIGNIN DEBUG ===')
    console.log('Data received:', data)
    
    const validation = validateSignIn(data)
    console.log('Validation result:', validation)
    
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

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión'
      showError(errorMessage)
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }, [showError])

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

  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
      showError('Error al cerrar sesión')
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [showError])

  const refreshProfile = useCallback(async () => {
    if (!state.user?.id) return
    try {
      const profile = await fetchProfile(state.user.id)
      setState(prev => ({ ...prev, profile }))
    } catch (error) {
      console.error('Error refreshing profile:', error)
      showError('Error al actualizar perfil')
    }
  }, [state.user?.id, fetchProfile, showError])

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

      setState(prev => ({ ...prev, profile: data }))
      showSuccess('Perfil actualizado correctamente')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar perfil'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [state.user?.id, state.profile, showSuccess, showError])

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