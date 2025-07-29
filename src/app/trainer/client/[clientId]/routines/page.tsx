// app/client/[clientId]/routines/page.tsx - Enhanced Client Routines
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { supabase, Profile, Routine, Exercise } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Dumbbell, 
  Clock, 
  Target,
  TrendingUp,
  Filter,
  Search,
  Grid3X3,
  List
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import CreateRoutineForm from '@/components/CreateRoutineForm'
import { Input } from '@/components/ui/input'

type RoutineWithExercises = Routine & {
  exercises: Exercise[]
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes', short: 'Lun', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 2, label: 'Martes', short: 'Mar', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 3, label: 'Miércoles', short: 'Mié', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 4, label: 'Jueves', short: 'Jue', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 5, label: 'Viernes', short: 'Vie', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 6, label: 'Sábado', short: 'Sáb', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 0, label: 'Domingo', short: 'Dom', color: 'bg-pink-50 text-pink-700 border-pink-200' },
]

export default function ClientRoutines() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const clientId = params.clientId as string
  
  const [client, setClient] = useState<Profile | null>(null)
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([])
  const [loading, setLoading] = useState(true)
  const [createRoutineOpen, setCreateRoutineOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDay, setFilterDay] = useState<number | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    if (!user || profile?.role !== 'trainer') {
      router.push('/')
      return
    }
    fetchClientData()
    fetchRoutines()
  }, [user, profile, router, clientId])

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', clientId)
        .single()

      if (error) {
        console.error('Error fetching client:', error)
        router.push('/trainer/dashboard')
      } else {
        setClient(data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchRoutines = async () => {
    try {
      const { data, error } = await supabase
        .from('routines')
        .select(`
          *,
          exercises(*)
        `)
        .eq('client_id', clientId)
        .eq('trainer_id', user?.id)
        .order('week_day')

      if (error) {
        console.error('Error fetching routines:', error)
      } else {
        setRoutines(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoutineCreated = () => {
    setCreateRoutineOpen(false)
    fetchRoutines()
  }

  const filteredRoutines = routines.filter(routine => {
    const matchesSearch = routine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         routine.muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesDay = filterDay === 'all' || routine.week_day === filterDay
    
    return matchesSearch && matchesDay
  })

  const groupRoutinesByDay = () => {
    const grouped: { [key: number]: RoutineWithExercises[] } = {}
    
    filteredRoutines.forEach(routine => {
      if (!grouped[routine.week_day]) {
        grouped[routine.week_day] = []
      }
      grouped[routine.week_day].push(routine)
    })
    
    return grouped
  }

  const getRoutineStats = () => {
    const totalExercises = routines.reduce((acc, routine) => acc + routine.exercises.length, 0)
    const activeRoutines = routines.filter(r => r.active).length
    const daysWithRoutines = [...new Set(routines.map(r => r.week_day))].length
    
    return { totalExercises, activeRoutines, daysWithRoutines }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando rutinas...</p>
        </div>
      </div>
    )
  }

  const groupedRoutines = groupRoutinesByDay()
  const stats = getRoutineStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/trainer/dashboard')}
                className="p-2 hover:bg-red-50 hover:text-red-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Rutinas de {client?.full_name}
                  </h1>
                  <p className="text-gray-600">Gestiona las rutinas semanales</p>
                </div>
              </div>
            </div>
            
            <Dialog open={createRoutineOpen} onOpenChange={setCreateRoutineOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Rutina
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Rutina</DialogTitle>
                  <DialogDescription>
                    Agrega una nueva rutina para {client?.full_name}
                  </DialogDescription>
                </DialogHeader>
                <CreateRoutineForm 
                  clientId={clientId} 
                  onRoutineCreated={handleRoutineCreated} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Total de Rutinas</CardTitle>
              <Dumbbell className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900">{stats.activeRoutines}</div>
              <p className="text-xs text-red-700 mt-1">Rutinas activas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Días Cubiertos</CardTitle>
              <Calendar className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{stats.daysWithRoutines}</div>
              <p className="text-xs text-blue-700 mt-1">de 7 días</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Total Ejercicios</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{stats.totalExercises}</div>
              <p className="text-xs text-green-700 mt-1">En todas las rutinas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar rutinas por nombre o grupo muscular..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const days = [1, 2, 3, 4, 5, 6, 0, 'all']
                  const currentIndex = days.indexOf(filterDay)
                  const nextIndex = (currentIndex + 1) % days.length
                  setFilterDay(days[nextIndex] as number | 'all')
                }}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>
                  {filterDay === 'all' ? 'Todos los días' : 
                   DAYS_OF_WEEK.find(d => d.value === filterDay)?.label}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Routines Content */}
        {filteredRoutines.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                {searchQuery || filterDay !== 'all' ? 'No se encontraron rutinas' : 'No hay rutinas creadas'}
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {searchQuery || filterDay !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : `Crea la primera rutina para ${client?.full_name} y comienza a planificar sus entrenamientos`
                }
              </p>
              {!searchQuery && filterDay === 'all' && (
                <Button onClick={() => setCreateRoutineOpen(true)} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Crear Primera Rutina
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'list' ? (
          // List View
          <div className="space-y-6">
            {filteredRoutines.map(routine => {
              const dayInfo = DAYS_OF_WEEK.find(d => d.value === routine.week_day)
              return (
                <Card key={routine.id} className="hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        <Badge className={dayInfo?.color}>
                          {dayInfo?.short}
                        </Badge>
                        <div>
                          <CardTitle className="text-xl mb-2">{routine.name}</CardTitle>
                          <CardDescription className="text-base">
                            {routine.muscle_group}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={routine.active ? "default" : "secondary"}>
                          {routine.active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {routine.exercises.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                          <Dumbbell className="w-4 h-4 mr-2" />
                          {routine.exercises.length} ejercicio(s) programados
                        </div>
                        <div className="grid gap-3">
                          {routine.exercises
                            .sort((a, b) => a.exercise_order - b.exercise_order)
                            .slice(0, 3)
                            .map(exercise => (
                            <div key={exercise.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                              <span className="font-medium text-gray-900">{exercise.name}</span>
                              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {exercise.sets && exercise.reps && 
                                  `${exercise.sets}x${exercise.reps}`
                                }
                                {exercise.weight && ` - ${exercise.weight}`}
                              </span>
                            </div>
                          ))}
                          {routine.exercises.length > 3 && (
                            <div className="text-center text-sm text-gray-500 py-2">
                              +{routine.exercises.length - 3} ejercicios más
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end pt-4 border-t border-gray-200">
                          <Button 
                            variant="outline" 
                            onClick={() => router.push(`/trainer/routine/${routine.id}/exercises`)}
                            className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                          >
                            Editar Ejercicios
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">No hay ejercicios agregados</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/trainer/routine/${routine.id}/exercises`)}
                          className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Ejercicios
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          // Grid View by Day
          <div className="space-y-12">
            {DAYS_OF_WEEK.map(day => {
              const dayRoutines = groupedRoutines[day.value] || []
              if (dayRoutines.length === 0 && (filterDay !== 'all' && filterDay !== day.value)) {
                return null
              }
              
              return (
                <div key={day.value}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <div className={`w-4 h-4 rounded-full mr-3 ${day.color.split(' ')[0]}`}></div>
                      {day.label}
                      {dayRoutines.length > 0 && (
                        <Badge variant="secondary" className="ml-3">
                          {dayRoutines.length} rutina(s)
                        </Badge>
                      )}
                    </h2>
                  </div>

                  {dayRoutines.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {dayRoutines.map(routine => (
                        <Card key={routine.id} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                          <CardHeader className="pb-4">
                            <div className="flex justify-between items-start mb-3">
                              <Badge className={day.color}>
                                {day.short}
                              </Badge>
                              <Badge variant={routine.active ? "default" : "secondary"}>
                                {routine.active ? 'Activa' : 'Inactiva'}
                              </Badge>
                            </div>
                            <CardTitle className="text-lg group-hover:text-red-600 transition-colors">
                              {routine.name}
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                              {routine.muscle_group}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {routine.exercises.length > 0 ? (
                              <div className="space-y-4">
                                <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                  <Dumbbell className="w-4 h-4 mr-2 text-red-500" />
                                  {routine.exercises.length} ejercicio(s)
                                </div>
                                <div className="space-y-2">
                                  {routine.exercises
                                    .sort((a, b) => a.exercise_order - b.exercise_order)
                                    .slice(0, 2)
                                    .map(exercise => (
                                    <div key={exercise.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                                      <span className="font-medium text-gray-900 text-sm truncate">{exercise.name}</span>
                                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded whitespace-nowrap ml-2">
                                        {exercise.sets && exercise.reps && 
                                          `${exercise.sets}x${exercise.reps}`
                                        }
                                        {exercise.weight && ` - ${exercise.weight}`}
                                      </span>
                                    </div>
                                  ))}
                                  {routine.exercises.length > 2 && (
                                    <div className="text-center text-xs text-gray-500 py-2">
                                      +{routine.exercises.length - 2} más
                                    </div>
                                  )}
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/trainer/routine/${routine.id}/exercises`)}
                                  className="w-full hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200"
                                >
                                  Editar Ejercicios
                                </Button>
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm mb-4">Sin ejercicios</p>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/trainer/routine/${routine.id}/exercises`)}
                                  className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Agregar
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-dashed border-2 border-gray-300 hover:border-red-300 transition-colors duration-200">
                      <CardContent className="py-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-4">No hay rutinas para {day.label.toLowerCase()}</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCreateRoutineOpen(true)}
                          className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Crear Rutina
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}