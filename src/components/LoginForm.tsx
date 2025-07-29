// components/LoginForm.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginForm() {
  const { signIn, signUp } = useAuth()
  
  // Estados para Sign In
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  })
  
  // Estados para Sign Up
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    fullName: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    console.log('LoginForm: Attempting sign in with:', signInData)

    try {
      const result = await signIn({
        email: signInData.email,
        password: signInData.password
      })
      
      console.log('LoginForm: SignIn result:', result)
      
      if (!result.success) {
        setError(result.error || 'Error al iniciar sesión')
      }
    } catch (err) {
      console.error('LoginForm: SignIn error:', err)
      setError('Error inesperado al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    console.log('LoginForm: Attempting sign up with:', signUpData)

    try {
      const result = await signUp({
        email: signUpData.email,
        password: signUpData.password,
        fullName: signUpData.fullName,
        role: 'client' // Todos los nuevos registros son clientes por defecto
      })
      
      console.log('LoginForm: SignUp result:', result)
      
      if (result.success) {
        setSuccess('Cuenta creada exitosamente. Revisa tu email para confirmar.')
        // Limpiar formulario
        setSignUpData({
          email: '',
          password: '',
          fullName: ''
        })
      } else {
        setError(result.error || 'Error al crear cuenta')
      }
    } catch (err) {
      console.error('LoginForm: SignUp error:', err)
      setError('Error inesperado al crear cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
        <TabsTrigger value="signup">Registrarse</TabsTrigger>
      </TabsList>
      
      <TabsContent value="signin">
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              value={signInData.email}
              onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="tu@email.com"
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signin-password">Contraseña</Label>
            <Input
              id="signin-password"
              type="password"
              value={signInData.password}
              onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Tu contraseña"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="signup">
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-fullname">Nombre Completo</Label>
            <Input
              id="signup-fullname"
              type="text"
              value={signUpData.fullName}
              onChange={(e) => setSignUpData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Tu nombre completo"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              value={signUpData.email}
              onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="tu@email.com"
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signup-password">Contraseña</Label>
            <Input
              id="signup-password"
              type="password"
              value={signUpData.password}
              onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            Al registrarte, crearás una cuenta de cliente. Si eres entrenador, contacta al administrador.
          </p>
        </form>
      </TabsContent>
    </Tabs>
  )
}