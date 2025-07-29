// app/client/dashboard/page.tsx - Enhanced Client Dashboard
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase, Routine, Exercise, MealPlan } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Calendar, 
  Dumbbell, 
  Utensils, 
  LogOut, 
  Clock, 
  Play, 
  Image as ImageIcon,
  TrendingUp,
  Target,
  Flame,
  Award,
  ChevronLeft,
  ChevronRight,
  CheckCircle
} from 'lucide-react'

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
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())
  const [mediaModal, setMediaModal] = useState<{
    isOpen: boolean
    type: 'image' | 'video' | null
    url: string
    exerciseName: string
  }>({
    isOpen: false,
    type: null,
    url: '',
    exerciseName: ''
  })

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

  const toggleExerciseCompletion = (exerciseId: string) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev)
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId)
      } else {
        newSet.add(exerciseId)
      }
      return newSet
    })
  }

  const renderExerciseMedia = (exercise: Exercise) => {
    const hasVideo = exercise.video_url
    const hasImage = exercise.image_url

    if (!hasVideo && !hasImage) return null

    const openMedia = (type: 'image' | 'video', url: string) => {
      setMediaModal({
        isOpen: true,
        type,
        url,
        exerciseName: exercise.name
      })
    }

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {hasVideo && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openMedia('video', exercise.video_url!)}
            className="text-xs border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600"
          >
            <Play className="w-3 h-3 mr-1" />
            Ver Video
          </Button>
        )}
        {hasImage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openMedia('image', exercise.image_url!)}
            className="text-xs border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600"
          >
            <ImageIcon className="w-3 h-3 mr-1" />
            Ver Imagen
          </Button>
        )}
      </div>
    )
  }

  const closeMediaModal = () => {
    setMediaModal({
      isOpen: false,
      type: null,
      url: '',
      exerciseName: ''
    })
  }

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    return url
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    const currentIndex = DAYS_OF_WEEK.findIndex(day => day.value === selectedDay)
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    
    if (newIndex >= DAYS_OF_WEEK.length) newIndex = 0
    if (newIndex < 0) newIndex = DAYS_OF_WEEK.length - 1
    
    setSelectedDay(DAYS_OF_WEEK[newIndex].value)
  }

  const getCompletionPercentage = () => {
    const todayRoutines = getTodayRoutines()
    const totalExercises = todayRoutines.reduce((acc, routine) => acc + routine.exercises.length, 0)
    if (totalExercises === 0) return 0
    
    const completedCount = Array.from(completedExercises).filter(exerciseId => 
      todayRoutines.some(routine => 
        routine.exercises.some(exercise => exercise.id === exerciseId)
      )
    ).length
    
    return Math.round((completedCount / totalExercises) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando tu entrenamiento...</p>
        </div>
      </div>
    )
  }

  const todayRoutines = getTodayRoutines()
  const todayMeals = getTodayMeals()
  const completionPercentage = getCompletionPercentage()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mi Entrenamiento</h1>
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
        {/* Progress Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Progreso Hoy</CardTitle>
              <TrendingUp className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900">{completionPercentage}%</div>
              <p className="text-xs text-red-700 mt-1">Ejercicios completados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Rutinas esta semana</CardTitle>
              <Dumbbell className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{routines.length}</div>
              <p className="text-xs text-blue-700 mt-1">Planificadas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Ejercicios totales</CardTitle>
              <Clock className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {routines.reduce((total, routine) => total + routine.exercises.length, 0)}
              </div>
              <p className="text-xs text-green-700 mt-1">En tu plan</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Comidas planificadas</CardTitle>
              <Utensils className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{mealPlans.length}</div>
              <p className="text-xs text-purple-700 mt-1">Esta semana</p>
            </CardContent>
          </Card>
        </div>

        {/* Week Calendar */}
        <Card className="mb-8 hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-red-600" />
                  Calendario Semanal
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Selecciona un día para ver tus rutinas y plan alimenticio
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDay('prev')}
                  className="border-gray-300 hover:border-red-300 hover:text-red-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDay('next')}
                  className="border-gray-300 hover:border-red-300 hover:text-red-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6">
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(day => {
                const isToday = day.value === new Date().getDay()
                const isSelected = day.value === selectedDay
                const hasRoutines = routines.filter(r => r.week_day === day.value).length > 0
                const hasMeals = mealPlans.filter(m => m.day_of_week === day.value).length > 0
                
                return (
                  <Button
                    key={day.value}
                    variant={isSelected ? "default" : "outline"}
                    className={`
                      flex flex-col py-4 h-auto text-sm px-2 relative transition-all duration-200
                      ${isSelected 
                        ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg border-red-600' 
                        : 'border-gray-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                      }
                      ${isToday && !isSelected ? 'border-red-400 bg-red-50 text-red-700' : ''}
                    `}
                    onClick={() => setSelectedDay(day.value)}
                  >
                    <span className="font-semibold mb-1">{day.short}</span>
                    {isToday && <span className="text-xs font-bold">HOY</span>}
                    <div className="flex space-x-1 mt-2">
                      {hasRoutines && (
                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-red-500'}`}></div>
                      )}
                      {hasMeals && (
                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`}></div>
                      )}
                    </div>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Today's Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Routines */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Dumbbell className="w-5 h-5 mr-2 text-red-600" />
                Rutinas de {getCurrentDayName()}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {todayRoutines.length > 0 ? `${todayRoutines.length} rutina(s) programada(s)` : 'No hay rutinas para este día'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayRoutines.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">¡Día de descanso!</p>
                  <p className="text-sm text-gray-400">No tienes entrenamientos programados</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {todayRoutines.map(routine => (
                    <div key={routine.id} className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{routine.name}</h3>
                          <Badge className="bg-red-100 text-red-800 border-red-200 mt-2">
                            {routine.muscle_group}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                          <Clock className="w-4 h-4 mr-1" />
                          {routine.exercises.length} ejercicios
                        </div>
                      </div>

                      {routine.exercises.length > 0 ? (
                        <div className="space-y-3">
                          {routine.exercises
                            .sort((a, b) => a.exercise_order - b.exercise_order)
                            .map((exercise, index) => {
                              const isCompleted = completedExercises.has(exercise.id)
                              return (
                                <div 
                                  key={exercise.id} 
                                  className={`
                                    p-4 rounded-lg border transition-all duration-200 cursor-pointer
                                    ${isCompleted 
                                      ? 'bg-green-50 border-green-200' 
                                      : 'bg-white border-gray-200 hover:border-red-200 hover:bg-red-50'
                                    }
                                  `}
                                  onClick={() => toggleExerciseCompletion(exercise.id)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-start space-x-3 flex-1">
                                      <div className={`
                                        w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 transition-all duration-200
                                        ${isCompleted 
                                          ? 'border-green-500 bg-green-500' 
                                          : 'border-gray-300 hover:border-red-400'
                                        }
                                      `}>
                                        {isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
                                      </div>
                                      <div className="flex-1">
                                        <span className={`font-medium ${isCompleted ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                                          {index + 1}. {exercise.name}
                                        </span>
                                        {exercise.notes && (
                                          <p className="text-sm text-gray-600 mt-1">{exercise.notes}</p>
                                        )}
                                        {renderExerciseMedia(exercise)}
                                      </div>
                                    </div>
                                    <div className="text-right text-sm ml-4">
                                      {exercise.sets && exercise.reps && (
                                        <div className="font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                          {exercise.sets}x{exercise.reps}
                                        </div>
                                      )}
                                      {exercise.weight && (
                                        <div className="text-gray-600 mt-1">{exercise.weight}</div>
                                      )}
                                      {exercise.rest_time && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Descanso: {exercise.rest_time}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-6">
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
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Utensils className="w-5 h-5 mr-2 text-red-600" />
                Plan Alimenticio de {getCurrentDayName()}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {todayMeals.length > 0 ? `${todayMeals.length} comida(s) programada(s)` : 'No hay plan alimenticio para este día'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayMeals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Utensils className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Sin plan alimenticio</p>
                  <p className="text-sm text-gray-400">Tu entrenador aún no ha asignado comidas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayMeals
                    .sort((a, b) => {
                      const order = ['desayuno', 'colacion', 'almuerzo', 'merienda', 'cena']
                      return order.indexOf(a.meal_type) - order.indexOf(b.meal_type)
                    })
                    .map(meal => {
                      const mealColors = {
                        desayuno: 'bg-orange-50 border-orange-200 text-orange-800',
                        colacion: 'bg-yellow-50 border-yellow-200 text-yellow-800',
                        almuerzo: 'bg-green-50 border-green-200 text-green-800',
                        merienda: 'bg-purple-50 border-purple-200 text-purple-800',
                        cena: 'bg-blue-50 border-blue-200 text-blue-800'
                      }
                      
                      return (
                        <div key={meal.id} className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white">
                          <div className="flex items-center justify-between mb-3">
                            <Badge className={`capitalize ${mealColors[meal.meal_type]}`}>
                              {meal.meal_type}
                            </Badge>
                            <div className="flex items-center text-xs text-gray-500">
                              <Flame className="w-3 h-3 mr-1" />
                              Plan nutricional
                            </div>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{meal.description}</p>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Media Modal */}
      <Dialog open={mediaModal.isOpen} onOpenChange={closeMediaModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {mediaModal.type === 'video' ? '📹 Video' : '🖼️ Imagen'} - {mediaModal.exerciseName}
            </DialogTitle>
            <DialogDescription>
              Material de apoyo para el ejercicio
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center">
            {mediaModal.type === 'video' ? (
              <div className="w-full aspect-video">
                <iframe
                  src={getEmbedUrl(mediaModal.url)}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                ></iframe>
              </div>
            ) : (
              <img 
                src={mediaModal.url} 
                alt={mediaModal.exerciseName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlhYTJhZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIGNhcmdhbmRvIGltYWdlbjwvdGV4dD4KICA8L3N2Zz4K'
                }}
              />
            )}
          </div>

          <div className="flex justify-center mt-6">
            <Button 
              variant="outline" 
              onClick={() => window.open(mediaModal.url, '_blank')}
              className="border-red-300 hover:border-red-400 hover:bg-red-50 text-red-600"
            >
              Abrir en nueva pestaña
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}