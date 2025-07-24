// app/trainer/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase, Profile } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Users, Calendar, Utensils, LogOut } from 'lucide-react'

export default function TrainerDashboard() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || profile?.role !== 'trainer') {
      router.push('/')
      return
    }
    fetchClients()
  }, [user, profile, router])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching clients:', error)
      } else {
        console.log('Raw clients data:', data)
        const validClients = (data || []).map(client => ({
          ...client,
          full_name: client.full_name || 'Sin nombre',
          email: client.email || 'Sin email',
          active: client.active ?? true
        }))
        console.log('Processed clients:', validClients)
        setClients(validClients)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleClientStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !currentStatus })
        .eq('id', clientId)

      if (error) {
        console.error('Error updating client status:', error)
        alert('Error al actualizar el estado del cliente')
      } else {
        console.log(`Cliente ${clientId} ${!currentStatus ? 'activado' : 'desactivado'}`)
        // Refrescar la lista de clientes
        await fetchClients()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar el estado del cliente')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Entrenador</h1>
              <p className="text-gray-600">Bienvenido, {profile?.full_name}</p>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter(c => c?.active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Inactivos</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter(c => !c?.active).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Gestión de Clientes</CardTitle>
                <CardDescription>
                  Administra el acceso de tus clientes y sus rutinas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay clientes registrados aún</p>
                <p className="text-sm text-gray-400">Los clientes aparecerán aquí cuando se registren</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {client?.full_name?.[0]?.toUpperCase() || 'C'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {client?.full_name || 'Sin nombre'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {client?.email || 'Sin email'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Registrado: {client?.created_at ? new Date(client.created_at).toLocaleDateString() : 'Fecha desconocida'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Badge variant={client?.active ? "default" : "secondary"}>
                        {client?.active ? 'Activo' : 'Inactivo'}
                      </Badge>

                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Acceso:</span>
                        <Switch
                          checked={client?.active || false}
                          onCheckedChange={() => 
                            toggleClientStatus(client.id, client?.active || false)
                          }
                        />
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/trainer/client/${client.id}/routines`)}
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Rutinas
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/trainer/client/${client.id}/meals`)}
                        >
                          <Utensils className="w-4 h-4 mr-1" />
                          Alimentación
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}