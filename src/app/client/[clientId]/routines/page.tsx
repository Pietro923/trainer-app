// app/trainer/client/[clientId]/routines/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { supabase, Profile, Routine, Exercise } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Calendar, Dumbbell } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import CreateRoutineForm from '@/components/CreateRoutineForm'

type RoutineWithExercises = Routine & {
  exercises: Exercise[]
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
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

  const groupRoutinesByDay = () => {
    const grouped: { [key: number]: RoutineWithExercises[] } = {}
    
    routines.forEach(routine => {
      if (!grouped[routine.week_day]) {
        grouped[routine.week_day] = []
      }
      grouped[routine.week_day].push(routine)
    })
    
    return grouped
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const groupedRoutines = groupRoutinesByDay()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/trainer/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Rutinas de {client?.full_name}
                </h1>
                <p className="text-gray-600">Gestiona las rutinas semanales</p>
              </div>
            </div>
            
            <Dialog open={createRoutineOpen} onOpenChange={setCreateRoutineOpen}>
              <DialogTrigger asChild>
                <Button>
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
        {routines.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay rutinas creadas
              </h3>
              <p className="text-gray-500 mb-6">
                Crea la primera rutina para {client?.full_name}
              </p>
              <Button onClick={() => setCreateRoutineOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Rutina
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {DAYS_OF_WEEK.map(day => (
              <div key={day.value}>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  {day.label}
                  {groupedRoutines[day.value] && (
                    <Badge variant="secondary" className="ml-2">
                      {groupedRoutines[day.value].length} rutina(s)
                    </Badge>
                  )}
                </h2>

                {groupedRoutines[day.value] ? (
                  <div className="grid gap-4">
                    {groupedRoutines[day.value].map(routine => (
                      <Card key={routine.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                {routine.name}
                              </CardTitle>
                              <CardDescription>
                                {routine.muscle_group}
                              </CardDescription>
                            </div>
                            <Badge variant={routine.active ? "default" : "secondary"}>
                              {routine.active ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {routine.exercises.length > 0 ? (
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600 mb-3">
                                <Dumbbell className="w-4 h-4 mr-1" />
                                {routine.exercises.length} ejercicio(s)
                              </div>
                              <div className="grid gap-2">
                                {routine.exercises
                                  .sort((a, b) => a.exercise_order - b.exercise_order)
                                  .map(exercise => (
                                  <div key={exercise.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span className="font-medium">{exercise.name}</span>
                                    <span className="text-sm text-gray-600">
                                      {exercise.sets && exercise.reps && 
                                        `${exercise.sets}x${exercise.reps}`
                                      }
                                      {exercise.weight && ` - ${exercise.weight}`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-end pt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/trainer/routine/${routine.id}/exercises`)}
                                >
                                  Editar Ejercicios
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-gray-500 mb-3">No hay ejercicios agregados</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(`/trainer/routine/${routine.id}/exercises`)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Agregar Ejercicios
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                      <p className="text-gray-500">No hay rutinas para este día</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}