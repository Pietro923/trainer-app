// app/trainer/dashboard/page.tsx - Enhanced Trainer Dashboard
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase, Profile } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Users, 
  Calendar, 
  Utensils, 
  LogOut, 
  TrendingUp, 
  Activity, 
  Clock,
  UserCheck,
  UserX,
  Dumbbell,
  BarChart3,
  Search,
  Filter,
  Plus
} from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function TrainerDashboard() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

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
        const validClients = (data || []).map(client => ({
          ...client,
          full_name: client.full_name || 'Sin nombre',
          email: client.email || 'Sin email',
          active: client.active ?? true
        }))
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
        await fetchClients()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar el estado del cliente')
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && client.active) ||
                         (filterStatus === 'inactive' && !client.active)
    
    return matchesSearch && matchesFilter
  })

  const activeClients = clients.filter(c => c?.active).length
  const inactiveClients = clients.filter(c => !c?.active).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Panel de Entrenador
                </h1>
                <p className="text-gray-600">
                  Bienvenido, <span className="font-medium text-red-600">{profile?.full_name}</span>
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={signOut} 
              className="w-full sm:w-auto border-gray-300 hover:border-red-300 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Total Clientes</CardTitle>
              <Users className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900">{clients.length}</div>
              <p className="text-xs text-red-700 mt-1">+2 este mes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Clientes Activos</CardTitle>
              <UserCheck className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{activeClients}</div>
              <p className="text-xs text-green-700 mt-1">
                {((activeClients / clients.length) * 100 || 0).toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Clientes Inactivos</CardTitle>
              <UserX className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">{inactiveClients}</div>
              <p className="text-xs text-orange-700 mt-1">
                {((inactiveClients / clients.length) * 100 || 0).toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Actividad Hoy</CardTitle>
              <Activity className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">8</div>
              <p className="text-xs text-blue-700 mt-1">Rutinas completadas</p>
            </CardContent>
          </Card>
        </div>

       

        {/* Clients Management */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-red-600" />
                  Gestión de Clientes
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Administra el acceso de tus clientes y sus rutinas
                </CardDescription>
              </div>
              
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar clientes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64 border-gray-300 focus:border-red-500 focus:ring-red-500/20"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextFilter = filterStatus === 'all' ? 'active' : 
                                     filterStatus === 'active' ? 'inactive' : 'all'
                    setFilterStatus(nextFilter)
                  }}
                  className="border-gray-300 hover:border-red-300 hover:text-red-600"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {filterStatus === 'all' ? 'Todos' : 
                   filterStatus === 'active' ? 'Activos' : 'Inactivos'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6">
            {filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados aún'}
                </p>
                <p className="text-gray-400 text-sm">
                  {searchQuery ? 'Intenta con otro término de búsqueda' : 'Los clientes aparecerán aquí cuando se registren'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClients.map((client) => (
                  <div 
                    key={client.id} 
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 bg-white"
                  >
                    {/* Client Info */}
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-red-700 font-semibold text-lg">
                          {client?.full_name?.[0]?.toUpperCase() || 'C'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">
                          {client?.full_name || 'Sin nombre'}
                        </h3>
                        <p className="text-gray-500 truncate">
                          {client?.email || 'Sin email'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Registrado: {client?.created_at ? new Date(client.created_at).toLocaleDateString('es-ES') : 'Fecha desconocida'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge 
                          variant={client?.active ? "default" : "secondary"}
                          className={client?.active ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}
                        >
                          {client?.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 font-medium">Acceso:</span>
                          <Switch
                            checked={client?.active || false}
                            onCheckedChange={() => 
                              toggleClientStatus(client.id, client?.active || false)
                            }
                            className="data-[state=checked]:bg-red-600"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/trainer/client/${client.id}/routines`)}
                          className="flex-1 sm:flex-none border-gray-300 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Rutinas
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/trainer/client/${client.id}/meals`)}
                          className="flex-1 sm:flex-none border-gray-300 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                        >
                          <Utensils className="w-4 h-4 mr-2" />
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