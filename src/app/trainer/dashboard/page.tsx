// app/trainer/dashboard/page.tsx - Dashboard Completo del Entrenador
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase, Profile, RoutineTemplate, MealPlanTemplate } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
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
  Plus,
  BookOpen,
  ChefHat,
  Target,
  Star,
  ArrowRight,
  Zap,
  User,
  Settings,
  FileText,
  Award
} from 'lucide-react'

export default function TrainerDashboard() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState<Profile[]>([])
  const [routineTemplates, setRoutineTemplates] = useState<RoutineTemplate[]>([])
  const [mealTemplates, setMealTemplates] = useState<MealPlanTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [totalAssignments, setTotalAssignments] = useState(0)

  useEffect(() => {
    if (!user || profile?.role !== 'trainer') {
      router.push('/')
      return
    }
    fetchData()
  }, [user, profile, router])

  const fetchData = async () => {
    try {
      // Fetch clients
      const { data: clientsData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false })

      // Fetch routine templates
      const { data: routineTemplatesData } = await supabase
        .from('routine_templates')
        .select('*')
        .eq('trainer_id', user?.id)
        .eq('active', true)
        .order('created_at', { ascending: false })

      // Fetch meal templates
      const { data: mealTemplatesData } = await supabase
        .from('meal_plan_templates')
        .select('*')
        .eq('trainer_id', user?.id)
        .eq('active', true)
        .order('created_at', { ascending: false })

      // Fetch total assignments
      const { data: assignmentsData } = await supabase
        .from('client_routine_assignments')
        .select('id')
        .eq('trainer_id', user?.id)
        .eq('active', true)

      setClients(clientsData || [])
      setRoutineTemplates(routineTemplatesData || [])
      setMealTemplates(mealTemplatesData || [])
      setTotalAssignments(assignmentsData?.length || 0)
    } catch (error) {
      console.error('Error fetching data:', error)
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
        await fetchData()
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
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
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
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Panel de Entrenador
                </h1>
                <p className="text-gray-600">
                  Bienvenido, <span className="font-medium text-orange-600">{profile?.full_name}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={signOut} 
                className="w-full sm:w-auto border-gray-300 hover:border-orange-300 hover:text-orange-600 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Total Clientes</CardTitle>
              <Users className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">{clients.length}</div>
              <p className="text-xs text-orange-700 mt-1">{activeClients} activos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Templates de Rutinas</CardTitle>
              <BookOpen className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{routineTemplates.length}</div>
              <p className="text-xs text-blue-700 mt-1">Rutinas creadas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Templates de Comida</CardTitle>
              <ChefHat className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{mealTemplates.length}</div>
              <p className="text-xs text-green-700 mt-1">Planes alimenticios</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Asignaciones Activas</CardTitle>
              <Activity className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{totalAssignments}</div>
              <p className="text-xs text-purple-700 mt-1">Rutinas asignadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Template Management */}
          <Card className="border-0 bg-gradient-to-br from-white via-gray-50/50 to-orange-50/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
  <CardHeader className="pb-6">
    <div className="flex items-center space-x-3">
      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
        <Target className="w-6 h-6 text-white" />
      </div>
      <div>
        <CardTitle className="text-xl sm:text-2xl text-gray-900 font-bold">
          Gestión de Templates
        </CardTitle>
        <CardDescription className="text-gray-600 mt-1">
          Crea y administra tus rutinas y planes alimenticios reutilizables
        </CardDescription>
      </div>
    </div>
  </CardHeader>
  
  <CardContent className="pt-0">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Template de Rutinas */}
      <div 
        onClick={() => router.push('/trainer/routine-templates')}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              Templates de Rutinas
            </h3>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-blue-100 text-sm">
                {routineTemplates.length} creados
              </span>
              {routineTemplates.length > 0 && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
        </div>
        
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      </div>

      {/* Template de Comidas */}
      <div 
        onClick={() => router.push('/trainer/meal-templates')}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-green-300"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-800 mb-1">
              Templates de Comida
            </h3>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-600 text-sm">
                {mealTemplates.length} creados
              </span>
              {mealTemplates.length > 0 && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
        </div>
        
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transpaorangent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      </div>
    </div>
  </CardContent>
</Card>

          {/* Recent Templates */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 flex items-center">
                <Star className="w-5 h-5 mr-2 text-orange-600" />
                Templates Recientes
              </CardTitle>
              <CardDescription className="text-gray-600">
                Tus últimas rutinas y planes creados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {routineTemplates.slice(0, 3).map(template => (
                  <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Dumbbell className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{template.name}</p>
                        <p className="text-xs text-gray-500">{template.muscle_group}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => router.push(`/trainer/routine-templates/${template.id}/exercises`)}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {mealTemplates.slice(0, 2).map(template => (
                  <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <ChefHat className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{template.name}</p>
                        <p className="text-xs text-gray-500">{template.goal}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => router.push(`/trainer/meal-templates/${template.id}`)}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {routineTemplates.length === 0 && mealTemplates.length === 0 && (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm mb-3">No hay templates creados aún</p>
                    <Button 
                      size="sm"
                      onClick={() => router.push('/trainer/routine-templates')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Crear Primer Template
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Clients Management */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-orange-600" />
                  Gestión de Clientes
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Administra el acceso de tus clientes y asigna rutinas y planes
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
                    className="pl-10 w-full sm:w-64 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
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
                  className="border-gray-300 hover:border-orange-300 hover:text-orange-600"
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
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-700 font-semibold text-lg">
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
                          <span className="text-sm text-gray-600 font-medium">Activo:</span>
                          <Switch
                            checked={client?.active || false}
                            onCheckedChange={() => 
                              toggleClientStatus(client.id, client?.active || false)
                            }
                            className="data-[state=checked]:bg-orange-600"
                          />
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          <span>ID: {client.id.slice(0, 8)}...</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:space-y-0">
  <Button
    variant="outline"
    size="sm"
    onClick={() => router.push(`/trainer/client/${client.id}/assign-routines`)}
    className="w-full sm:flex-1 border-gray-300 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 text-xs sm:text-sm"
  >
    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
    <span className="truncate">Asignar Rutinas</span>
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={() => router.push(`/trainer/client/${client.id}/assign-meals`)}
    className="w-full sm:flex-1 border-gray-300 hover:border-green-300 hover:text-green-600 hover:bg-green-50 text-xs sm:text-sm"
  >
    <Utensils className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
    <span className="truncate">Asignar Comidas</span>
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