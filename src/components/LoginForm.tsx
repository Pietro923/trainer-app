// components/LoginForm.tsx - Enhanced with Red/Gray Theme
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

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
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('signin')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await signIn({
        email: signInData.email,
        password: signInData.password
      })
      
      if (!result.success) {
        setError(result.error || 'Error al iniciar sesión')
      }
    } catch (err) {
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

    try {
      const result = await signUp({
        email: signUpData.email,
        password: signUpData.password,
        fullName: signUpData.fullName,
        role: 'client'
      })
      
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
      setError('Error inesperado al crear cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
          <TabsTrigger 
            value="signin"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all duration-200 font-medium"
          >
            Iniciar Sesión
          </TabsTrigger>
          <TabsTrigger 
            value="signup"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all duration-200 font-medium"
          >
            Registrarse
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="signin" className="space-y-4 mt-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="text-gray-700 font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="signin-email"
                  type="email"
                  value={signInData.email}
                  onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="tu@email.com"
                  className="pl-10 h-12 bg-gray-50 border-gray-200 focus:border-red-500 focus:ring-red-500/20 rounded-xl transition-all duration-200"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signin-password" className="text-gray-700 font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  value={signInData.password}
                  onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Tu contraseña"
                  className="pl-10 pr-12 h-12 bg-gray-50 border-gray-200 focus:border-red-500 focus:ring-red-500/20 rounded-xl transition-all duration-200"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50 animate-slide-up">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 animate-slide-up">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4 mt-6">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-fullname" className="text-gray-700 font-medium">
                Nombre Completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="signup-fullname"
                  type="text"
                  value={signUpData.fullName}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Tu nombre completo"
                  className="pl-10 h-12 bg-gray-50 border-gray-200 focus:border-red-500 focus:ring-red-500/20 rounded-xl transition-all duration-200"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-gray-700 font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="signup-email"
                  type="email"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="tu@email.com"
                  className="pl-10 h-12 bg-gray-50 border-gray-200 focus:border-red-500 focus:ring-red-500/20 rounded-xl transition-all duration-200"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-gray-700 font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={signUpData.password}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10 pr-12 h-12 bg-gray-50 border-gray-200 focus:border-red-500 focus:ring-red-500/20 rounded-xl transition-all duration-200"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50 animate-slide-up">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 animate-slide-up">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4">
              <p className="text-xs text-gray-600 text-center leading-relaxed">
                Al registrarte, crearás una cuenta de cliente. 
                <br />
                <span className="font-medium text-gray-700">
                  Si eres entrenador, contacta al administrador.
                </span>
              </p>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {/* Additional Info */}
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          ¿Necesitas ayuda? {" "}
          <a 
            href="mailto:soporte@trainerapp.com" 
            className="text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Contacta soporte
          </a>
        </p>
      </div>
    </div>
  )
}