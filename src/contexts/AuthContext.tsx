// contexts/AuthContext.tsx
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
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      // Intentar obtener el perfil de la base de datos
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (data) {
        setProfile(data)
      } else {
        console.log('Profile not found, creating one...')
        // Si no existe perfil, crear uno básico
        const { data: user } = await supabase.auth.getUser()
        
        if (user.user) {
          const newProfile: Profile = {
              id: userId,
              email: user.user.email || null,
              full_name: user.user.user_metadata?.full_name || null,
              role: 'client',
              active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              client: undefined
          }

          // Intentar insertar el perfil
          const { data: insertedProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single()

          if (insertedProfile) {
            setProfile(insertedProfile)
          } else {
            console.error('Error creating profile:', insertError)
            // Como fallback, usar el perfil temporal
            setProfile(newProfile)
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      // En caso de cualquier error, crear perfil básico temporal
      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        const fallbackProfile: Profile = {
            id: userId,
            email: user.user.email || null,
            full_name: 'Usuario',
            role: 'client',
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            client: undefined
        }
        setProfile(fallbackProfile)
      }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, fullName: string, role: 'trainer' | 'client') => {
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

    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
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