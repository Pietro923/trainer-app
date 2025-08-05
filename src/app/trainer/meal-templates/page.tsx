// app/trainer/meal-templates/page.tsx - Gestión de Templates de Planes Alimenticios
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase, MealPlanTemplateWithMeals, MEAL_GOALS } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Plus, 
  Utensils, 
  Clock, 
  Target,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  Star,
  Users,
  TrendingUp,
  BookOpen,
  Apple
} from 'lucide-react'

// Extendemos el tipo para incluir mealCount calculado
type TemplateWithCount = MealPlanTemplateWithMeals & {
  mealCount: number
}

export default function MealTemplatesPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [mealTemplates, setMealTemplates] = useState<TemplateWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGoal, setFilterGoal] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal: ''
  })
  const [createLoading, setCreateLoading] = useState(false)

  // ✅ FUNCIÓN ESTABLE PARA MANEJAR CAMBIOS EN EL FORMULARIO
  const handleFormDataChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // ✅ FUNCIÓN ESTABLE PARA RESETEAR FORMULARIO
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      goal: ''
    })
  }, [])

  useEffect(() => {
    if (!user || profile?.role !== 'trainer') {
      router.push('/')
      return
    }
    fetchMealTemplates()
  }, [user, profile, router])

  const fetchMealTemplates = async () => {
    try {
      // Fetch meal templates with meals
      const { data, error } = await supabase
        .from('meal_plan_templates')
        .select(`
          *,
          template_meals(*)
        `)
        .eq('trainer_id', user?.id)
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching meal templates:', error)
      } else {
        // Transform the data to match our types and add mealCount
        const templatesWithCount: TemplateWithCount[] = (data || []).map(template => ({
          ...template,
          meals: template.template_meals || [], // Mapear template_meals a meals
          mealCount: template.template_meals?.length || 0 // Calcular mealCount
        }))
        setMealTemplates(templatesWithCount)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)

    try {
      const templateData = {
        trainer_id: user?.id,
        name: formData.name,
        description: formData.description || null,
        goal: formData.goal || null,
        active: true
      }

      const { data, error } = await supabase
        .from('meal_plan_templates')
        .insert([templateData])
        .select()
        .single()

      if (error) {
        console.error('Error creating template:', error)
        alert('Error al crear el template')
      } else {
        resetForm()
        setCreateDialogOpen(false)
        
        // Redirect to edit meals
        router.push(`/trainer/meal-templates/${data.id}/meals`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear el template')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDuplicateTemplate = async (template: TemplateWithCount) => {
    if (!confirm(`¿Duplicar el template "${template.name}"?`)) return

    try {
      // Create new template
      const newTemplate = {
        trainer_id: user?.id,
        name: `${template.name} (Copia)`,
        description: template.description,
        goal: template.goal,
        active: true
      }

      const { data: createdTemplate, error: templateError } = await supabase
        .from('meal_plan_templates')
        .insert([newTemplate])
        .select()
        .single()

      if (templateError) throw templateError

      // Duplicate meals if any exist
      if (template.meals && template.meals.length > 0) {
        const newMeals = template.meals.map(meal => ({
          template_id: createdTemplate.id,
          meal_type: meal.meal_type,
          name: meal.name,
          description: meal.description,
          calories: meal.calories,
          macros: meal.macros,
          meal_order: meal.meal_order
        }))

        const { error: insertError } = await supabase
          .from('template_meals')
          .insert(newMeals)

        if (insertError) throw insertError
      }

      await fetchMealTemplates()
    } catch (error) {
      console.error('Error duplicating template:', error)
      alert('Error al duplicar el template')
    }
  }

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`¿Eliminar el template "${templateName}"? Esta acción no se puede deshacer.`)) return

    try {
      const { error } = await supabase
        .from('meal_plan_templates')
        .update({ active: false })
        .eq('id', templateId)

      if (error) {
        console.error('Error deleting template:', error)
        alert('Error al eliminar el template')
      } else {
        await fetchMealTemplates()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar el template')
    }
  }

  const filteredTemplates = mealTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesGoal = filterGoal === 'all' || template.goal === filterGoal
    
    return matchesSearch && matchesGoal
  })

  const getGoalColor = (goal: string | null) => {
    switch (goal) {
      case 'definicion': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'volumen': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'mantenimiento': return 'bg-green-100 text-green-800 border-green-200'
      case 'perdida_peso': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getGoalLabel = (goal: string | null) => {
    const goalObj = MEAL_GOALS.find(g => g.value === goal)
    return goalObj?.label || 'Sin objetivo'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando templates...</p>
        </div>
      </div>
    )
  }

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
                className="p-2 hover:bg-orange-50 hover:text-orange-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Apple className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Templates de Alimentación
                  </h1>
                  <p className="text-gray-600">Crea y gestiona tus planes alimenticios reutilizables</p>
                </div>
              </div>
            </div>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Template de Alimentación</DialogTitle>
                  <DialogDescription>
                    Crea un template reutilizable que podrás asignar a múltiples clientes
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="name">Nombre del Template *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleFormDataChange('name', e.target.value)}
                        placeholder="Ej: Plan Definición, Dieta Volumen"
                        required
                        disabled={createLoading}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="goal">Objetivo</Label>
                      <Select 
                        value={formData.goal} 
                        onValueChange={(value) => handleFormDataChange('goal', value)}
                        disabled={createLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona objetivo" />
                        </SelectTrigger>
                        <SelectContent>
                          {MEAL_GOALS.map(goal => (
                            <SelectItem key={goal.value} value={goal.value}>
                              {goal.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleFormDataChange('description', e.target.value)}
                        placeholder="Describe los objetivos y características de este plan alimenticio..."
                        rows={3}
                        disabled={createLoading}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setCreateDialogOpen(false)
                        resetForm()
                      }}
                      disabled={createLoading}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createLoading}
                    >
                      {createLoading ? 'Creando...' : 'Crear y Agregar Comidas'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Total Templates</CardTitle>
              <Apple className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{mealTemplates.length}</div>
              <p className="text-xs text-green-700 mt-1">Planes creados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Total Comidas</CardTitle>
              <Utensils className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                {mealTemplates.reduce((total, template) => total + template.mealCount, 0)}
              </div>
              <p className="text-xs text-orange-700 mt-1">En todos los templates</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar templates por nombre o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterGoal} onValueChange={setFilterGoal}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Objetivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los objetivos</SelectItem>
                  {MEAL_GOALS.map(goal => (
                    <SelectItem key={goal.value} value={goal.value}>{goal.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Apple className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                {searchQuery || filterGoal !== 'all' 
                  ? 'No se encontraron templates' 
                  : 'No hay templates creados'}
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {searchQuery || filterGoal !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Crea tu primer template de alimentación para empezar a organizar los planes nutricionales'
                }
              </p>
              {!searchQuery && filterGoal === 'all' && (
                <Button onClick={() => setCreateDialogOpen(true)} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Crear Primer Template
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map(template => (
              <Card key={template.id} className="hover:shadow-lg transition-all duration-200 group">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Alimentación
                    </Badge>
                    {template.goal && (
                      <Badge className={getGoalColor(template.goal)}>
                        {getGoalLabel(template.goal)}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg group-hover:text-green-600 transition-colors">
                    {template.name}
                  </CardTitle>
                  {template.description && (
                    <CardDescription className="text-sm line-clamp-2">
                      {template.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Utensils className="w-4 h-4 mr-2 text-green-500" />
                        {template.mealCount} comida(s)
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/trainer/meal-templates/${template.id}/meals`)}
                          className="hover:bg-green-50 hover:text-green-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id, template.name)}
                          className="hover:bg-orange-50 hover:text-orange-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => router.push(`/trainer/meal-templates/${template.id}/meals`)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {template.mealCount === 0 ? 'Agregar Comidas' : 'Ver Comidas'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}