// app/trainer/client/[clientId]/meals/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { supabase, Profile, MealPlan } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Utensils, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import CreateMealPlanForm from '@/components/CreateMealPlanForm'

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
]

const MEAL_TYPES = [
  { value: 'desayuno', label: 'Desayuno', color: 'bg-orange-100 text-orange-800' },
  { value: 'colacion', label: 'Colación', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'almuerzo', label: 'Almuerzo', color: 'bg-green-100 text-green-800' },
  { value: 'merienda', label: 'Merienda', color: 'bg-purple-100 text-purple-800' },
  { value: 'cena', label: 'Cena', color: 'bg-blue-100 text-blue-800' },
]

export default function ClientMeals() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const clientId = params.clientId as string
  
  const [client, setClient] = useState<Profile | null>(null)
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [createMealOpen, setCreateMealOpen] = useState(false)

  useEffect(() => {
    if (!user || profile?.role !== 'trainer') {
      router.push('/')
      return
    }
    fetchClientData()
    fetchMealPlans()
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

  const fetchMealPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('client_id', clientId)
        .eq('trainer_id', user?.id)
        .order('day_of_week')
        .order('meal_type')

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

  const handleMealCreated = () => {
    setCreateMealOpen(false)
    fetchMealPlans()
  }

  const deleteMealPlan = async (mealId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este plan alimenticio?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', mealId)

      if (error) {
        console.error('Error deleting meal plan:', error)
      } else {
        fetchMealPlans()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const groupMealsByDay = () => {
    const grouped: { [key: number]: MealPlan[] } = {}
    
    mealPlans.forEach(meal => {
      if (!grouped[meal.day_of_week]) {
        grouped[meal.day_of_week] = []
      }
      grouped[meal.day_of_week].push(meal)
    })
    
    return grouped
  }

  const getMealTypeColor = (mealType: string) => {
    const type = MEAL_TYPES.find(t => t.value === mealType)
    return type?.color || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const groupedMeals = groupMealsByDay()

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
                  Plan Alimenticio de {client?.full_name}
                </h1>
                <p className="text-gray-600">Gestiona las comidas semanales</p>
              </div>
            </div>
            
            <Dialog open={createMealOpen} onOpenChange={setCreateMealOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Comida
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Nueva Comida</DialogTitle>
                  <DialogDescription>
                    Agrega una comida al plan semanal de {client?.full_name}
                  </DialogDescription>
                </DialogHeader>
                <CreateMealPlanForm 
                  clientId={clientId} 
                  onMealCreated={handleMealCreated} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mealPlans.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Utensils className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay plan alimenticio creado
              </h3>
              <p className="text-gray-500 mb-6">
                Crea el primer plan alimenticio para {client?.full_name}
              </p>
              <Button onClick={() => setCreateMealOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {DAYS_OF_WEEK.map(day => (
              <div key={day.value}>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Utensils className="w-5 h-5 mr-2" />
                  {day.label}
                  {groupedMeals[day.value] && (
                    <Badge variant="secondary" className="ml-2">
                      {groupedMeals[day.value].length} comida(s)
                    </Badge>
                  )}
                </h2>

                {groupedMeals[day.value] ? (
                  <div className="grid gap-4">
                    {groupedMeals[day.value]
                      .sort((a, b) => {
                        const order = ['desayuno', 'colacion', 'almuerzo', 'merienda', 'cena']
                        return order.indexOf(a.meal_type) - order.indexOf(b.meal_type)
                      })
                      .map(meal => (
                      <Card key={meal.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg capitalize">
                                {meal.meal_type}
                              </CardTitle>
                              <Badge className={getMealTypeColor(meal.meal_type)}>
                                {meal.meal_type}
                              </Badge>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteMealPlan(meal.id)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {meal.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                      <p className="text-gray-500">No hay comidas planificadas para este día</p>
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