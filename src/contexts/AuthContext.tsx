// contexts/AuthContext.tsx - Con mejor debugging
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

  // Función para actualizar el estado de forma segura
  const updateState = useCallback((updates: Partial<AuthState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }))
    }
  }, [])

  // Función para obtener el perfil con manejo de errores mejorado
  const fetchProfile = useCallback(async (userId: string, retryCount = 0): Promise<Profile | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116' && retryCount === 0) {
          try {
            const { data: user } = await supabase.auth.getUser()
            if (user.user && user.user.id === userId) {
              const newProfile: Omit<Profile, 'created_at' | 'updated_at'> = {
                id: userId,
                email: user.user.email || null,
                full_name: user.user.user_metadata?.full_name || 'Usuario',
                role: user.user.user_metadata?.role || 'client',
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
              
              return createdProfile
            }
          } catch (createError) {
            console.error('Error creating profile:', createError)
          }
        }
        
        console.error('Error fetching profile:', error)
        return null
      }

      return profile
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      return null
    }
  }, [])

  // Función para inicializar la sesión
  const initializeAuth = useCallback(async () => {
    if (initializingRef.current) return
    initializingRef.current = true

    try {
      updateState({ loading: true, error: null })

      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        updateState({
          user: null,
          profile: null,
          loading: false,
          initialized: true,
          error: error.message
        })
        return
      }

      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        updateState({
          user: session.user,
          profile,
          loading: false,
          initialized: true,
          error: null
        })
      } else {
        updateState({
          user: null,
          profile: null,
          loading: false,
          initialized: true,
          error: null
        })
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      updateState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
        error: error instanceof Error ? error.message : 'Error de inicialización'
      })
    } finally {
      initializingRef.current = false
    }
  }, [fetchProfile, updateState])

  // Efectos
  useEffect(() => {
    mountedRef.current = true
    
    if (!state.initialized && !initializingRef.current) {
      initializeAuth()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (!mountedRef.current) return

        try {
          if (session?.user) {
            const profile = await fetchProfile(session.user.id)
            updateState({
              user: session.user,
              profile,
              loading: false,
              error: null
            })

            if (event === 'SIGNED_IN' && profile) {
              showSuccess(`¡Bienvenido, ${profile.full_name}!`)
            }
          } else {
            updateState({
              user: null,
              profile: null,
              loading: false,
              error: null
            })

            if (event === 'SIGNED_OUT') {
              showSuccess('Sesión cerrada correctamente')
            }
          }
        } catch (error) {
          console.error('Error in auth state change:', error)
          updateState({
            loading: false,
            error: error instanceof Error ? error.message : 'Error de autenticación'
          })
        }
      }
    )

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  // Funciones de autenticación CON DEBUGGING MEJORADO
  const signIn = useCallback(async (data: SignInData): Promise<{ success: boolean; error?: string }> => {
    console.log('=== SIGNIN DEBUG ===')
    console.log('Data received:', data)
    console.log('Data type:', typeof data)
    console.log('Email:', data?.email, 'Password length:', data?.password?.length)
    
    const validation = validateSignIn(data)
    console.log('Validation result:', validation)
    
    if (!validation.success) {
      console.log('Validation errors:', validation.error?.issues)
      const firstError = validation.error?.issues?.[0]?.message || 'Datos inválidos'
      console.log('First error message:', firstError)
      showError(firstError)
      return { success: false, error: firstError }
    }

    try {
      updateState({ loading: true, error: null })
      console.log('Attempting Supabase signIn with:', validation.data)

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password
      })

      console.log('Supabase response:', { authData, error })

      if (error) {
        console.log('Supabase auth error:', error)
        throw error
      }

      if (!authData.user) {
        throw new Error('No se pudo iniciar sesión')
      }

      console.log('Login successful!')
      return { success: true }
    } catch (error) {
      console.log('Catch block error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión'
      showError(errorMessage)
      updateState({ loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  }, [showError, updateState])

  const signUp = useCallback(async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    console.log('=== SIGNUP DEBUG ===')
    console.log('Data received:', data)
    
    const validation = validateSignUp(data)
    console.log('Validation result:', validation)
    
    if (!validation.success) {
      console.log('Validation errors:', validation.error?.issues)
      const firstError = validation.error?.issues?.[0]?.message || 'Datos inválidos'
      showError(firstError)
      return { success: false, error: firstError }
    }

    try {
      updateState({ loading: true, error: null })

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
      updateState({ loading: false })
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear cuenta'
      showError(errorMessage)
      updateState({ loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  }, [showError, showSuccess, updateState])

  const signOut = useCallback(async () => {
    try {
      updateState({ loading: true })
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error signing out:', error)
      showError('Error al cerrar sesión')
      updateState({ loading: false })
    }
  }, [showError, updateState])

  const refreshProfile = useCallback(async () => {
    if (!state.user?.id) return

    try {
      const profile = await fetchProfile(state.user.id)
      updateState({ profile })
    } catch (error) {
      console.error('Error refreshing profile:', error)
      showError('Error al actualizar perfil')
    }
  }, [state.user?.id, fetchProfile, updateState, showError])

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

      if (error) {
        throw error
      }

      updateState({ profile: data })
      showSuccess('Perfil actualizado correctamente')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar perfil'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [state.user?.id, state.profile, updateState, showSuccess, showError])

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        throw error
      }

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