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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Panel de Entrenador</h1>
              <p className="text-sm sm:text-base text-gray-600">Bienvenido, {profile?.full_name}</p>
            </div>
            <Button variant="outline" onClick={signOut} className="w-full sm:w-auto">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Clientes</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Clientes Activos</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {clients.filter(c => c?.active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Clientes Inactivos</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
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
                <CardTitle className="text-lg sm:text-xl">Gestión de Clientes</CardTitle>
                <CardDescription className="text-sm">
                  Administra el acceso de tus clientes y sus rutinas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {clients.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">No hay clientes registrados aún</p>
                <p className="text-xs sm:text-sm text-gray-400">Los clientes aparecerán aquí cuando se registren</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {clients.map((client) => (
                  <div key={client.id} className="border rounded-lg p-3 sm:p-4">
                    {/* Info del cliente */}
                    <div className="flex items-start space-x-3 mb-3 sm:mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-medium text-sm sm:text-base">
                          {client?.full_name?.[0]?.toUpperCase() || 'C'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {client?.full_name || 'Sin nombre'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {client?.email || 'Sin email'}
                        </p>
                        <p className="text-xs text-gray-400 hidden sm:block">
                          Registrado: {client?.created_at ? new Date(client.created_at).toLocaleDateString() : 'Fecha desconocida'}
                        </p>
                      </div>
                      {/* Badge de estado - Solo en desktop */}
                      <div className="hidden sm:block">
                        <Badge variant={client?.active ? "default" : "secondary"}>
                          {client?.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>

                    {/* Controles - Layout responsive */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {/* Primera fila en móvil: Estado y Toggle */}
                      <div className="flex items-center justify-between sm:justify-start sm:space-x-4">
                        {/* Badge visible en móvil */}
                        <Badge 
                          variant={client?.active ? "default" : "secondary"}
                          className="text-xs sm:hidden"
                        >
                          {client?.active ? 'Activo' : 'Inactivo'}
                        </Badge>

                        {/* Toggle de acceso */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs sm:text-sm text-gray-600">Acceso:</span>
                          <Switch
                            checked={client?.active || false}
                            onCheckedChange={() => 
                              toggleClientStatus(client.id, client?.active || false)
                            }
                          />
                        </div>
                      </div>

                      {/* Segunda fila en móvil: Botones de acción */}
                      <div className="flex space-x-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/trainer/client/${client.id}/routines`)}
                          className="flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Rutinas</span>
                          <span className="sm:hidden">Rutinas</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/trainer/client/${client.id}/meals`)}
                          className="flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <Utensils className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Alimentación</span>
                          <span className="sm:hidden">Alimentación</span>
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