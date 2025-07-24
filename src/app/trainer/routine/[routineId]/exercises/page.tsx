// app/trainer/routine/[routineId]/exercises/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { supabase, Routine, Exercise, Profile } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Dumbbell, Edit, Trash2, GripVertical } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import CreateExerciseForm from '@/components/CreateExerciseForm'

type RoutineWithClient = Routine & {
  client: Profile
  exercises: Exercise[]
}

export default function RoutineExercises() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const routineId = params.routineId as string
  
  const [routine, setRoutine] = useState<RoutineWithClient | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [createExerciseOpen, setCreateExerciseOpen] = useState(false)

  useEffect(() => {
    if (!user || profile?.role !== 'trainer') {
      router.push('/')
      return
    }
    fetchRoutineData()
  }, [user, profile, router, routineId])

  const fetchRoutineData = async () => {
    try {
      const { data: routineData, error: routineError } = await supabase
        .from('routines')
        .select(`
          *,
          client:profiles!routines_client_id_fkey(*),
          exercises(*)
        `)
        .eq('id', routineId)
        .single()

      if (routineError) {
        console.error('Error fetching routine:', routineError)
        router.push('/trainer/dashboard')
      } else {
        setRoutine(routineData)
        setExercises(routineData.exercises.sort((a: { exercise_order: number }, b: { exercise_order: number }) => a.exercise_order - b.exercise_order))
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExerciseCreated = () => {
    setCreateExerciseOpen(false)
    fetchRoutineData()
  }

  const deleteExercise = async (exerciseId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este ejercicio?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId)

      if (error) {
        console.error('Error deleting exercise:', error)
      } else {
        fetchRoutineData()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const updateExerciseOrder = async (exerciseId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('exercises')
        .update({ exercise_order: newOrder })
        .eq('id', exerciseId)

      if (error) {
        console.error('Error updating exercise order:', error)
      } else {
        fetchRoutineData()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= exercises.length) return

    const exercise = exercises[index]
    const targetExercise = exercises[newIndex]

    updateExerciseOrder(exercise.id, targetExercise.exercise_order)
    updateExerciseOrder(targetExercise.id, exercise.exercise_order)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!routine) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Rutina no encontrada</h2>
          <Button onClick={() => router.push('/trainer/dashboard')} className="mt-4">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push(`/trainer/client/${routine.client_id}/routines`)}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {routine.name}
                </h1>
                <p className="text-gray-600">
                  {routine.client.full_name} • {routine.muscle_group}
                </p>
              </div>
            </div>
            
            <Dialog open={createExerciseOpen} onOpenChange={setCreateExerciseOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Ejercicio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Ejercicio</DialogTitle>
                  <DialogDescription>
                    Agrega un ejercicio a la rutina "{routine.name}"
                  </DialogDescription>
                </DialogHeader>
                <CreateExerciseForm 
                  routineId={routineId} 
                  nextOrder={exercises.length}
                  onExerciseCreated={handleExerciseCreated} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {exercises.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Dumbbell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay ejercicios en esta rutina
              </h3>
              <p className="text-gray-500 mb-6">
                Agrega el primer ejercicio para comenzar
              </p>
              <Button onClick={() => setCreateExerciseOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Ejercicio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise, index) => (
              <Card key={exercise.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveExercise(index, 'up')}
                          disabled={index === 0}
                          className="p-1 h-6 w-6"
                        >
                          ↑
                        </Button>
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveExercise(index, 'down')}
                          disabled={index === exercises.length - 1}
                          className="p-1 h-6 w-6"
                        >
                          ↓
                        </Button>
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {index + 1}. {exercise.name}
                        </CardTitle>
                        {exercise.notes && (
                          <CardDescription className="mt-1">
                            {exercise.notes}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteExercise(exercise.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {exercise.sets && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Series:</span>
                        <p className="text-lg font-semibold">{exercise.sets}</p>
                      </div>
                    )}
                    {exercise.reps && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Repeticiones:</span>
                        <p className="text-lg font-semibold">{exercise.reps}</p>
                      </div>
                    )}
                    {exercise.weight && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Peso:</span>
                        <p className="text-lg font-semibold">{exercise.weight}</p>
                      </div>
                    )}
                    {exercise.rest_time && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Descanso:</span>
                        <p className="text-lg font-semibold">{exercise.rest_time}</p>
                      </div>
                    )}
                  </div>
                  
                  {(exercise.video_url || exercise.image_url) && (
                    <div className="mt-4 flex space-x-2">
                      {exercise.video_url && (
                        <Badge variant="outline">📹 Video</Badge>
                      )}
                      {exercise.image_url && (
                        <Badge variant="outline">📷 Imagen</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}