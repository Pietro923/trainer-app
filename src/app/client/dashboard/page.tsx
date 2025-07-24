// app/client/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase, Routine, Exercise, MealPlan } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Dumbbell, Utensils, LogOut, Clock } from 'lucide-react'

type RoutineWithExercises = Routine & {
  exercises: Exercise[]
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
]

export default function ClientDashboard() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([])
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())

  useEffect(() => {
    if (!user || profile?.role !== 'client') {
      router.push('/')
      return
    }
    fetchRoutines()
    fetchMealPlans()
  }, [user, profile, router])

  const fetchRoutines = async () => {
    try {
      const { data, error } = await supabase
        .from('routines')
        .select(`
          *,
          exercises(*)
        `)
        .eq('client_id', user?.id)
        .eq('active', true)
        .order('week_day')

      if (error) {
        console.error('Error fetching routines:', error)
      } else {
        setRoutines(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchMealPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('client_id', user?.id)
        .eq('active', true)
        .order('day_of_week')

      if (error) {
        console.error('Error fetching meal plans:', error)
      } else {
        setMealPlans(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTodayRoutines = () => {
    return routines.filter(routine => routine.week_day === selectedDay)
  }

  const getTodayMeals = () => {
    return mealPlans.filter(meal => meal.day_of_week === selectedDay)
  }

  const getCurrentDayName = () => {
    return DAYS_OF_WEEK.find(day => day.value === selectedDay)?.label || 'Hoy'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const todayRoutines = getTodayRoutines()
  const todayMeals = getTodayMeals()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Entrenamiento</h1>
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
        {/* Week Calendar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Calendario Semanal
            </CardTitle>
            <CardDescription>
              Selecciona un día para ver tus rutinas y plan alimenticio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <Button
                  key={day.value}
                  variant={selectedDay === day.value ? "default" : "outline"}
                  className="flex flex-col py-4 h-auto"
                  onClick={() => setSelectedDay(day.value)}
                >
                  <span className="text-xs font-medium">{day.short}</span>
                  <span className="text-lg font-bold">{day.value === new Date().getDay() ? 'HOY' : ''}</span>
                  <div className="flex space-x-1 mt-1">
                    {routines.filter(r => r.week_day === day.value).length > 0 && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                    {mealPlans.filter(m => m.day_of_week === day.value).length > 0 && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Routines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Dumbbell className="w-5 h-5 mr-2" />
                Rutinas de {getCurrentDayName()}
              </CardTitle>
              <CardDescription>
                {todayRoutines.length > 0 ? `${todayRoutines.length} rutina(s) programada(s)` : 'No hay rutinas para este día'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayRoutines.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">¡Día de descanso!</p>
                  <p className="text-sm text-gray-400">No tienes entrenamientos programados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayRoutines.map(routine => (
                    <div key={routine.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{routine.name}</h3>
                          <Badge variant="secondary">{routine.muscle_group}</Badge>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {routine.exercises.length} ejercicios
                        </div>
                      </div>

                      {routine.exercises.length > 0 ? (
                        <div className="space-y-2">
                          {routine.exercises
                            .sort((a, b) => a.exercise_order - b.exercise_order)
                            .map((exercise, index) => (
                            <div key={exercise.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium">{index + 1}. {exercise.name}</span>
                                {exercise.notes && (
                                  <p className="text-sm text-gray-600">{exercise.notes}</p>
                                )}
                              </div>
                              <div className="text-right text-sm">
                                {exercise.sets && exercise.reps && (
                                  <div className="font-medium">{exercise.sets}x{exercise.reps}</div>
                                )}
                                {exercise.weight && (
                                  <div className="text-gray-600">{exercise.weight}</div>
                                )}
                                {exercise.rest_time && (
                                  <div className="text-xs text-gray-500">Descanso: {exercise.rest_time}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          Rutina sin ejercicios asignados
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meal Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Utensils className="w-5 h-5 mr-2" />
                Plan Alimenticio de {getCurrentDayName()}
              </CardTitle>
              <CardDescription>
                {todayMeals.length > 0 ? `${todayMeals.length} comida(s) programada(s)` : 'No hay plan alimenticio para este día'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayMeals.length === 0 ? (
                <div className="text-center py-8">
                  <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Sin plan alimenticio</p>
                  <p className="text-sm text-gray-400">Tu entrenador aún no ha asignado comidas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayMeals
                    .sort((a, b) => {
                      const order = ['desayuno', 'colacion', 'almuerzo', 'merienda', 'cena']
                      return order.indexOf(a.meal_type) - order.indexOf(b.meal_type)
                    })
                    .map(meal => (
                    <div key={meal.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="capitalize">
                          {meal.meal_type}
                        </Badge>
                      </div>
                      <p className="text-gray-700">{meal.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rutinas esta semana</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{routines.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ejercicios totales</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {routines.reduce((total, routine) => total + routine.exercises.length, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comidas planificadas</CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mealPlans.length}</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}