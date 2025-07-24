// components/AddClientForm.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

type AddClientFormProps = {
  onClientAdded: () => void
}

export default function AddClientForm({ onClientAdded }: AddClientFormProps) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Crear usuario directamente sin admin API (para development)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'client',
          }
        }
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('No se pudo crear el usuario')
        setLoading(false)
        return
      }

      // 2. Esperar un poco para que se cree el perfil automáticamente
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 3. Crear relación trainer-cliente
      const { error: relationError } = await supabase
        .from('trainer_clients')
        .insert([
          {
            trainer_id: user?.id,
            client_id: authData.user.id,
          },
        ])

      if (relationError) {
        setError(relationError.message)
        setLoading(false)
        return
      }

      // Limpiar formulario y notificar éxito
      setEmail('')
      setFullName('')
      setPassword('')
      onClientAdded()
      
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="clientFullName">Nombre Completo</Label>
        <Input
          id="clientFullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nombre del cliente"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientEmail">Email</Label>
        <Input
          id="clientEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@ejemplo.com"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="clientPassword">Contraseña Temporal</Label>
        <Input
          id="clientPassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña para el cliente"
          required
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Cliente'}
        </Button>
      </div>
    </form>
  )
}