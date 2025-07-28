// contexts/AuthContext.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile } from '@/lib/supabase'

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, fullName: string, role: 'trainer' | 'client') => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Función para obtener la sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            setLoading(false)
          }
          return
        }

        if (session?.user && mounted) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Obtener sesión inicial
    getInitialSession()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (data) {
        setProfile(data)
      } else if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        // Crear perfil básico si no existe
        const { data: user } = await supabase.auth.getUser()
        if (user.user) {
          const fallbackProfile: Profile = {
            id: userId,
            email: user.user.email || null,
            full_name: user.user.user_metadata?.full_name || null,
            role: 'client',
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          setProfile(fallbackProfile)
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      // Fallback profile en caso de error
      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        const fallbackProfile: Profile = {
          id: userId,
          email: user.user.email || null,
          full_name: 'Usuario',
          role: 'client',
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setProfile(fallbackProfile)
      }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      setLoading(false)
    }
    // El estado se actualizará automáticamente via onAuthStateChange
    
    return { data, error }
  }

  const signUp = async (email: string, password: string, fullName: string, role: 'trainer' | 'client') => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        }
      }
    })

    if (error) {
      setLoading(false)
    }
    // El estado se actualizará automáticamente via onAuthStateChange

    return { data, error }
  }

  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Error signing out:', error)
      setLoading(false)
    }
    // El estado se actualizará automáticamente via onAuthStateChange
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}