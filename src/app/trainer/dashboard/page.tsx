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
import { Plus, Users, Calendar, Utensils, LogOut } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import AddClientForm from '@/components/AddClientForm'

type ClientWithProfile = {
  id: string
  trainer_id: string
  client_id: string
  created_at: string
  client: Profile
}

export default function TrainerDashboard() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState<ClientWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [addClientOpen, setAddClientOpen] = useState(false)

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
        .from('trainer_clients')
        .select(`
          *,
          client:profiles!trainer_clients_client_id_fkey(*)
        `)
        .eq('trainer_id', user?.id)

      if (error) {
        console.error('Error fetching clients:', error)
      } else {
        setClients(data || [])
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
      } else {
        fetchClients() // Refrescar la lista
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleClientAdded = () => {
    setAddClientOpen(false)
    fetchClients()
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
                {clients.filter(c => c.client.active).length}
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
                {clients.filter(c => !c.client.active).length}
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
                  Administra tus clientes y sus rutinas
                </CardDescription>
              </div>
              <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
                    <DialogDescription>
                      Crea una cuenta para tu nuevo cliente
                    </DialogDescription>
                  </DialogHeader>
                  <AddClientForm onClientAdded={handleClientAdded} />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-400">Agrega tu primer cliente para comenzar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clients.map((clientRelation) => (
                  <div key={clientRelation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {clientRelation.client.full_name?.[0]?.toUpperCase() || 'C'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {clientRelation.client.full_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {clientRelation.client.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Badge variant={clientRelation.client.active ? "default" : "secondary"}>
                        {clientRelation.client.active ? 'Activo' : 'Inactivo'}
                      </Badge>

                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Acceso:</span>
                        <Switch
                          checked={clientRelation.client.active}
                          onCheckedChange={() => 
                            toggleClientStatus(clientRelation.client.id, clientRelation.client.active)
                          }
                        />
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/trainer/client/${clientRelation.client.id}/routines`)}
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Rutinas
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/trainer/client/${clientRelation.client.id}/meals`)}
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