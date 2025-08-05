// app/trainer/meal-templates/[templateId]/meals/page.tsx - Gestión de Comidas del Template
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { supabase, MealPlanTemplate, TemplateMeal, MEAL_TYPES } from '@/lib/supabase'
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
  Edit, 
  Trash2, 
  GripVertical,
  Clock,
  Target,
  Apple,
  Zap,
  Activity
} from 'lucide-react'

// ✅ COMPONENTE SEPARADO - FUERA DEL RENDER PRINCIPAL
interface MealFormProps {
  formData: {
    meal_type: string
    name: string
    description: string
    calories: string
    protein: string
    carbs: string
    fat: string
  }
  onFormDataChange: (field: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isEdit?: boolean
  formLoading: boolean
}

const MealForm: React.FC<MealFormProps> = ({ 
  formData, 
  onFormDataChange, 
  onSubmit, 
  onCancel, 
  isEdit = false, 
  formLoading 
}) => {
  // ✅ FUNCIÓN ESTABLE CON useCallback
  const handleInputChange = useCallback((field: string, value: string) => {
    onFormDataChange(field, value)
  }, [onFormDataChange])

  const getMealTypeColor = (mealType: string) => {
    const type = MEAL_TYPES.find(t => t.value === mealType)
    switch (type?.value) {
      case 'desayuno': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'colacion': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'almuerzo': return 'bg-green-100 text-green-800 border-green-200'
      case 'merienda': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'cena': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="meal_type">Tipo de Comida *</Label>
          <Select 
            value={formData.meal_type} 
            onValueChange={(value) => handleInputChange('meal_type', value)}
            disabled={formLoading}
          >
            <SelectTrigger className={formData.meal_type ? getMealTypeColor(formData.meal_type) : ''}>
              <SelectValue placeholder="Selecciona el tipo" />
            </SelectTrigger>
            <SelectContent>
              {MEAL_TYPES.map(meal => (
                <SelectItem key={meal.value} value={meal.value}>
                  {meal.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="name">Nombre de la Comida *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Ej: Avena con frutas"
            required
            disabled={formLoading}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción / Ingredientes *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe la comida, ingredientes, cantidades y preparación..."
          rows={4}
          required
          disabled={formLoading}
        />
      </div>

      {/* Información Nutricional */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Activity className="w-4 h-4 mr-2 text-green-600" />
          Información Nutricional (Opcional)
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="calories">Calorías</Label>
            <Input
              id="calories"
              type="number"
              value={formData.calories}
              onChange={(e) => handleInputChange('calories', e.target.value)}
              placeholder="350"
              min="0"
              disabled={formLoading}
            />
            <p className="text-xs text-gray-500 mt-1">kcal</p>
          </div>
          
          <div>
            <Label htmlFor="protein">Proteínas</Label>
            <Input
              id="protein"
              type="number"
              value={formData.protein}
              onChange={(e) => handleInputChange('protein', e.target.value)}
              placeholder="25"
              min="0"
              step="0.1"
              disabled={formLoading}
            />
            <p className="text-xs text-gray-500 mt-1">gramos</p>
          </div>
          
          <div>
            <Label htmlFor="carbs">Carbohidratos</Label>
            <Input
              id="carbs"
              type="number"
              value={formData.carbs}
              onChange={(e) => handleInputChange('carbs', e.target.value)}
              placeholder="45"
              min="0"
              step="0.1"
              disabled={formLoading}
            />
            <p className="text-xs text-gray-500 mt-1">gramos</p>
          </div>
          
          <div>
            <Label htmlFor="fat">Grasas</Label>
            <Input
              id="fat"
              type="number"
              value={formData.fat}
              onChange={(e) => handleInputChange('fat', e.target.value)}
              placeholder="12"
              min="0"
              step="0.1"
              disabled={formLoading}
            />
            <p className="text-xs text-gray-500 mt-1">gramos</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={formLoading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={formLoading}
        >
          {formLoading ? (isEdit ? 'Actualizando...' : 'Creando...') : (isEdit ? 'Actualizar Comida' : 'Crear Comida')}
        </Button>
      </div>
    </form>
  )
}

export default function TemplateMealsPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const templateId = params.templateId as string
  
  const [template, setTemplate] = useState<MealPlanTemplate | null>(null)
  const [meals, setMeals] = useState<TemplateMeal[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState<TemplateMeal | null>(null)
  const [formData, setFormData] = useState({
    meal_type: '',
    name: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  })
  const [formLoading, setFormLoading] = useState(false)

  // ✅ FUNCIÓN ESTABLE PARA MANEJAR CAMBIOS EN EL FORMULARIO
  const handleFormDataChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // ✅ FUNCIÓN ESTABLE PARA RESETEAR FORMULARIO
  const resetForm = useCallback(() => {
    setFormData({
      meal_type: '',
      name: '',
      description: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    })
  }, [])

  // ✅ FUNCIÓN ESTABLE PARA CANCELAR
  const handleCancel = useCallback(() => {
    resetForm()
    setCreateDialogOpen(false)
    setEditDialogOpen(false)
    setEditingMeal(null)
  }, [resetForm])

  useEffect(() => {
    if (!user || profile?.role !== 'trainer') {
      router.push('/')
      return
    }
    fetchTemplateData()
  }, [user, profile, router, templateId])

  const fetchTemplateData = async () => {
    try {
      // Fetch template info
      const { data: templateData, error: templateError } = await supabase
        .from('meal_plan_templates')
        .select('*')
        .eq('id', templateId)
        .eq('trainer_id', user?.id)
        .single()

      if (templateError) {
        console.error('Error fetching template:', templateError)
        router.push('/trainer/meal-templates')
        return
      }

      // Fetch meals
      const { data: mealsData, error: mealsError } = await supabase
        .from('template_meals')
        .select('*')
        .eq('template_id', templateId)
        .order('meal_order')

      if (mealsError) {
        console.error('Error fetching meals:', mealsError)
      }

      setTemplate(templateData)
      setMeals(mealsData || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMealToForm = useCallback((meal: TemplateMeal) => {
    setFormData({
      meal_type: meal.meal_type,
      name: meal.name,
      description: meal.description,
      calories: meal.calories?.toString() || '',
      protein: meal.macros?.protein?.toString() || '',
      carbs: meal.macros?.carbs?.toString() || '',
      fat: meal.macros?.fat?.toString() || ''
    })
  }, [])

  const handleCreateMeal = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const macros: any = {}
      if (formData.protein) macros.protein = parseFloat(formData.protein)
      if (formData.carbs) macros.carbs = parseFloat(formData.carbs)
      if (formData.fat) macros.fat = parseFloat(formData.fat)

      const mealData = {
        template_id: templateId,
        meal_type: formData.meal_type as 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'colacion',
        name: formData.name,
        description: formData.description,
        calories: formData.calories ? parseInt(formData.calories) : null,
        macros: Object.keys(macros).length > 0 ? macros : null,
        meal_order: meals.length
      }

      const { error } = await supabase
        .from('template_meals')
        .insert([mealData])

      if (error) throw error

      resetForm()
      setCreateDialogOpen(false)
      await fetchTemplateData()
    } catch (error) {
      console.error('Error creating meal:', error)
      alert('Error al crear la comida')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditMeal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMeal) return
    
    setFormLoading(true)
    try {
      const macros: any = {}
      if (formData.protein) macros.protein = parseFloat(formData.protein)
      if (formData.carbs) macros.carbs = parseFloat(formData.carbs)
      if (formData.fat) macros.fat = parseFloat(formData.fat)

      const mealData = {
        meal_type: formData.meal_type as 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'colacion',
        name: formData.name,
        description: formData.description,
        calories: formData.calories ? parseInt(formData.calories) : null,
        macros: Object.keys(macros).length > 0 ? macros : null
      }

      const { error } = await supabase
        .from('template_meals')
        .update(mealData)
        .eq('id', editingMeal.id)

      if (error) throw error

      resetForm()
      setEditDialogOpen(false)
      setEditingMeal(null)
      await fetchTemplateData()
    } catch (error) {
      console.error('Error updating meal:', error)
      alert('Error al actualizar la comida')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteMeal = async (mealId: string, mealName: string) => {
    if (!confirm(`¿Eliminar la comida "${mealName}"?`)) return

    try {
      const { error } = await supabase
        .from('template_meals')
        .delete()
        .eq('id', mealId)

      if (error) throw error
      await fetchTemplateData()
    } catch (error) {
      console.error('Error deleting meal:', error)
      alert('Error al eliminar la comida')
    }
  }

  const handleMoveMeal = async (mealId: string, currentOrder: number, direction: 'up' | 'down') => {
    const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1
    const targetMeal = meals.find(meal => meal.meal_order === targetOrder)
    
    if (!targetMeal) return

    try {
      // Swap orders
      await supabase
        .from('template_meals')
        .update({ meal_order: currentOrder })
        .eq('id', targetMeal.id)

      await supabase
        .from('template_meals')
        .update({ meal_order: targetOrder })
        .eq('id', mealId)

      await fetchTemplateData()
    } catch (error) {
      console.error('Error moving meal:', error)
      alert('Error al mover la comida')
    }
  }

  const openEditDialog = useCallback((meal: TemplateMeal) => {
    setEditingMeal(meal)
    loadMealToForm(meal)
    setEditDialogOpen(true)
  }, [loadMealToForm])

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'desayuno': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'colacion': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'almuerzo': return 'bg-green-100 text-green-800 border-green-200'
      case 'merienda': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'cena': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getMealTypeLabel = (mealType: string) => {
    const type = MEAL_TYPES.find(t => t.value === mealType)
    return type?.label || mealType
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando comidas...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Template no encontrado</h2>
          <Button onClick={() => router.push('/trainer/meal-templates')} className="mt-4">
            Volver a Templates
          </Button>
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
                onClick={() => router.push('/trainer/meal-templates')}
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
                    {template.name}
                  </h1>
                  <p className="text-gray-600">
                    Plan Alimenticio • {meals.length} comida(s)
                  </p>
                </div>
              </div>
            </div>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Comida
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Agregar Comida al Template</DialogTitle>
                  <DialogDescription>
                    Agrega una nueva comida a &quot;{template.name}&quot;
                  </DialogDescription>
                </DialogHeader>
                <MealForm 
                  formData={formData}
                  onFormDataChange={handleFormDataChange}
                  onSubmit={handleCreateMeal}
                  onCancel={handleCancel}
                  formLoading={formLoading}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Comida</DialogTitle>
                  <DialogDescription>
                    Modifica los detalles de la comida &quot;{editingMeal?.name}&quot;
                  </DialogDescription>
                </DialogHeader>
                <MealForm 
                  formData={formData}
                  onFormDataChange={handleFormDataChange}
                  onSubmit={handleEditMeal}
                  onCancel={handleCancel}
                  isEdit
                  formLoading={formLoading}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Template Info */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{template.name}</CardTitle>
                <CardDescription className="flex items-center space-x-4 mt-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Plan Alimenticio
                  </Badge>
                  {template.goal && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {template.goal}
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
            {template.description && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{template.description}</p>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Meals */}
        {meals.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Utensils className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay comidas en este template
              </h3>
              <p className="text-gray-500 mb-6">
                Agrega la primera comida para comenzar a construir el plan alimenticio
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primera Comida
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {meals.map((meal, index) => (
              <Card key={meal.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveMeal(meal.id, meal.meal_order, 'up')}
                          disabled={index === 0}
                          className="p-1 h-6 w-6"
                        >
                          ↑
                        </Button>
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveMeal(meal.id, meal.meal_order, 'down')}
                          disabled={index === meals.length - 1}
                          className="p-1 h-6 w-6"
                        >
                          ↓
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge className={getMealTypeColor(meal.meal_type)}>
                            {getMealTypeLabel(meal.meal_type)}
                          </Badge>
                          <CardTitle className="text-lg">
                            {meal.name}
                          </CardTitle>
                        </div>
                        <CardDescription className="mt-1">
                          {meal.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(meal)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteMeal(meal.id, meal.name)}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {(meal.calories || meal.macros) && (
                  <CardContent>
                    {/* Nutritional Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <Activity className="w-4 h-4 mr-2 text-green-600" />
                        Información Nutricional
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {meal.calories && (
                          <div className="text-center p-2 bg-white rounded border">
                            <div className="flex items-center justify-center mb-1">
                              <Zap className="w-4 h-4 text-orange-500 mr-1" />
                            </div>
                            <p className="font-semibold text-lg">{meal.calories}</p>
                            <p className="text-gray-600 text-xs">kcal</p>
                          </div>
                        )}
                        {meal.macros?.protein && (
                          <div className="text-center p-2 bg-white rounded border">
                            <p className="font-semibold text-lg text-orange-600">{meal.macros.protein}g</p>
                            <p className="text-gray-600 text-xs">Proteínas</p>
                          </div>
                        )}
                        {meal.macros?.carbs && (
                          <div className="text-center p-2 bg-white rounded border">
                            <p className="font-semibold text-lg text-blue-600">{meal.macros.carbs}g</p>
                            <p className="text-gray-600 text-xs">Carbohidratos</p>
                          </div>
                        )}
                        {meal.macros?.fat && (
                          <div className="text-center p-2 bg-white rounded border">
                            <p className="font-semibold text-lg text-yellow-600">{meal.macros.fat}g</p>
                            <p className="text-gray-600 text-xs">Grasas</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}