// app/trainer/routine-templates/[templateId]/exercises/page.tsx - ARREGLADO COMPLETAMENTE
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { supabase, RoutineTemplate, TemplateExercise } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Plus, 
  Dumbbell, 
  Edit, 
  Trash2, 
  GripVertical,
  Play,
  Image as ImageIcon,
  Clock,
  Target,
  BookOpen
} from 'lucide-react'

// ✅ COMPONENTE SEPARADO - FUERA DEL RENDER PRINCIPAL
interface ExerciseFormProps {
  formData: {
    name: string
    sets: string
    reps: string
    weight: string
    rest_time: string
    notes: string
    video_url: string
    image_url: string
  }
  onFormDataChange: (field: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isEdit?: boolean
  formLoading: boolean
}

const ExerciseForm: React.FC<ExerciseFormProps> = ({ 
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

  const isValidUrl = (url: string) => {
    if (!url.trim()) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="name">Nombre del Ejercicio *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Ej: Press de banca con barra"
            required
            disabled={formLoading}
          />
        </div>
        
        <div>
          <Label htmlFor="sets">Series</Label>
          <Input
            id="sets"
            type="number"
            value={formData.sets}
            onChange={(e) => handleInputChange('sets', e.target.value)}
            placeholder="4"
            min="1"
            max="20"
            disabled={formLoading}
          />
        </div>
        
        <div>
          <Label htmlFor="reps">Repeticiones</Label>
          <Input
            id="reps"
            value={formData.reps}
            onChange={(e) => handleInputChange('reps', e.target.value)}
            placeholder="8-10, 12, al fallo"
            disabled={formLoading}
          />
        </div>
        
        <div>
          <Label htmlFor="weight">Peso</Label>
          <Input
            id="weight"
            value={formData.weight}
            onChange={(e) => handleInputChange('weight', e.target.value)}
            placeholder="80kg, Peso corporal"
            disabled={formLoading}
          />
        </div>
        
        <div>
          <Label htmlFor="rest_time">Tiempo de Descanso</Label>
          <Input
            id="rest_time"
            value={formData.rest_time}
            onChange={(e) => handleInputChange('rest_time', e.target.value)}
            placeholder="2-3 min, 60 seg"
            disabled={formLoading}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notas / Instrucciones</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Instrucciones específicas, técnica, variaciones, etc."
          rows={3}
          disabled={formLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="video_url">URL del Video (opcional)</Label>
          <Input
            id="video_url"
            type="url"
            value={formData.video_url}
            onChange={(e) => handleInputChange('video_url', e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className={formData.video_url && !isValidUrl(formData.video_url) ? 'border-red-500' : ''}
            disabled={formLoading}
          />
          {formData.video_url && !isValidUrl(formData.video_url) && (
            <p className="text-sm text-red-600 mt-1">URL no válida</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="image_url">URL de la Imagen (opcional)</Label>
          <Input
            id="image_url"
            type="url"
            value={formData.image_url}
            onChange={(e) => handleInputChange('image_url', e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            className={formData.image_url && !isValidUrl(formData.image_url) ? 'border-red-500' : ''}
            disabled={formLoading}
          />
          {formData.image_url && !isValidUrl(formData.image_url) && (
            <p className="text-sm text-red-600 mt-1">URL no válida</p>
          )}
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
          disabled={
            formLoading ||
            (!!formData.video_url && !isValidUrl(formData.video_url)) ||
            (!!formData.image_url && !isValidUrl(formData.image_url))
          }
        >
          {formLoading ? (isEdit ? 'Actualizando...' : 'Creando...') : (isEdit ? 'Actualizar Ejercicio' : 'Crear Ejercicio')}
        </Button>
      </div>
    </form>
  )
}

export default function TemplateExercisesPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const templateId = params.templateId as string
  
  const [template, setTemplate] = useState<RoutineTemplate | null>(null)
  const [exercises, setExercises] = useState<TemplateExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<TemplateExercise | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    sets: '',
    reps: '',
    weight: '',
    rest_time: '',
    notes: '',
    video_url: '',
    image_url: ''
  })
  const [formLoading, setFormLoading] = useState(false)

  // ✅ FUNCIÓN ESTABLE PARA MANEJAR CAMBIOS EN EL FORMULARIO
  const handleFormDataChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // ✅ FUNCIÓN ESTABLE PARA RESETEAR FORMULARIO
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      sets: '',
      reps: '',
      weight: '',
      rest_time: '',
      notes: '',
      video_url: '',
      image_url: ''
    })
  }, [])

  // ✅ FUNCIÓN ESTABLE PARA CANCELAR
  const handleCancel = useCallback(() => {
    resetForm()
    setCreateDialogOpen(false)
    setEditDialogOpen(false)
    setEditingExercise(null)
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
        .from('routine_templates')
        .select('*')
        .eq('id', templateId)
        .eq('trainer_id', user?.id)
        .single()

      if (templateError) {
        console.error('Error fetching template:', templateError)
        router.push('/trainer/routine-templates')
        return
      }

      // Fetch exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('template_exercises')
        .select('*')
        .eq('template_id', templateId)
        .order('exercise_order')

      if (exercisesError) {
        console.error('Error fetching exercises:', exercisesError)
      }

      setTemplate(templateData)
      setExercises(exercisesData || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadExerciseToForm = useCallback((exercise: TemplateExercise) => {
    setFormData({
      name: exercise.name,
      sets: exercise.sets?.toString() || '',
      reps: exercise.reps || '',
      weight: exercise.weight || '',
      rest_time: exercise.rest_time || '',
      notes: exercise.notes || '',
      video_url: exercise.video_url || '',
      image_url: exercise.image_url || ''
    })
  }, [])

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const exerciseData = {
        template_id: templateId,
        name: formData.name,
        sets: formData.sets ? parseInt(formData.sets) : null,
        reps: formData.reps || null,
        weight: formData.weight || null,
        rest_time: formData.rest_time || null,
        notes: formData.notes || null,
        video_url: formData.video_url || null,
        image_url: formData.image_url || null,
        exercise_order: exercises.length
      }

      const { error } = await supabase
        .from('template_exercises')
        .insert([exerciseData])

      if (error) throw error

      resetForm()
      setCreateDialogOpen(false)
      await fetchTemplateData()
    } catch (error) {
      console.error('Error creating exercise:', error)
      alert('Error al crear el ejercicio')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditExercise = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExercise) return
    
    setFormLoading(true)
    try {
      const exerciseData = {
        name: formData.name,
        sets: formData.sets ? parseInt(formData.sets) : null,
        reps: formData.reps || null,
        weight: formData.weight || null,
        rest_time: formData.rest_time || null,
        notes: formData.notes || null,
        video_url: formData.video_url || null,
        image_url: formData.image_url || null
      }

      const { error } = await supabase
        .from('template_exercises')
        .update(exerciseData)
        .eq('id', editingExercise.id)

      if (error) throw error

      resetForm()
      setEditDialogOpen(false)
      setEditingExercise(null)
      await fetchTemplateData()
    } catch (error) {
      console.error('Error updating exercise:', error)
      alert('Error al actualizar el ejercicio')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteExercise = async (exerciseId: string, exerciseName: string) => {
    if (!confirm(`¿Eliminar el ejercicio "${exerciseName}"?`)) return

    try {
      const { error } = await supabase
        .from('template_exercises')
        .delete()
        .eq('id', exerciseId)

      if (error) throw error
      await fetchTemplateData()
    } catch (error) {
      console.error('Error deleting exercise:', error)
      alert('Error al eliminar el ejercicio')
    }
  }

  const handleMoveExercise = async (exerciseId: string, currentOrder: number, direction: 'up' | 'down') => {
    const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1
    const targetExercise = exercises.find(ex => ex.exercise_order === targetOrder)
    
    if (!targetExercise) return

    try {
      // Swap orders
      await supabase
        .from('template_exercises')
        .update({ exercise_order: currentOrder })
        .eq('id', targetExercise.id)

      await supabase
        .from('template_exercises')
        .update({ exercise_order: targetOrder })
        .eq('id', exerciseId)

      await fetchTemplateData()
    } catch (error) {
      console.error('Error moving exercise:', error)
      alert('Error al mover el ejercicio')
    }
  }

  const openEditDialog = useCallback((exercise: TemplateExercise) => {
    setEditingExercise(exercise)
    loadExerciseToForm(exercise)
    setEditDialogOpen(true)
  }, [loadExerciseToForm])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando ejercicios...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Template no encontrado</h2>
          <Button onClick={() => router.push('/trainer/routine-templates')} className="mt-4">
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
                onClick={() => router.push('/trainer/routine-templates')}
                className="p-2 hover:bg-red-50 hover:text-red-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {template.name}
                  </h1>
                  <p className="text-gray-600">
                    {template.muscle_group} • {exercises.length} ejercicio(s)
                  </p>
                </div>
              </div>
            </div>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Ejercicio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Ejercicio al Template</DialogTitle>
                  <DialogDescription>
                    Agrega un nuevo ejercicio a &quot;{template.name}&quot;
                  </DialogDescription>
                </DialogHeader>
                <ExerciseForm 
                  formData={formData}
                  onFormDataChange={handleFormDataChange}
                  onSubmit={handleCreateExercise}
                  onCancel={handleCancel}
                  formLoading={formLoading}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Editar Ejercicio</DialogTitle>
                  <DialogDescription>
                    Modifica los detalles del ejercicio &quot;{editingExercise?.name}&quot;
                  </DialogDescription>
                </DialogHeader>
                <ExerciseForm 
                  formData={formData}
                  onFormDataChange={handleFormDataChange}
                  onSubmit={handleEditExercise}
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
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {template.muscle_group}
                  </Badge>
                  {template.difficulty_level && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {template.difficulty_level}
                    </Badge>
                  )}
                  {template.estimated_duration && (
                    <span className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      {template.estimated_duration} min
                    </span>
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

        {/* Exercises */}
        {exercises.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Dumbbell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay ejercicios en este template
              </h3>
              <p className="text-gray-500 mb-6">
                Agrega el primer ejercicio para comenzar a construir la rutina
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
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
                          onClick={() => handleMoveExercise(exercise.id, exercise.exercise_order, 'up')}
                          disabled={index === 0}
                          className="p-1 h-6 w-6"
                        >
                          ↑
                        </Button>
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveExercise(exercise.id, exercise.exercise_order, 'down')}
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(exercise)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteExercise(exercise.id, exercise.name)}
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
                        <Badge variant="outline">
                          <Play className="w-3 h-3 mr-1" />
                          Video
                        </Badge>
                      )}
                      {exercise.image_url && (
                        <Badge variant="outline">
                          <ImageIcon className="w-3 h-3 mr-1" />
                          Imagen
                        </Badge>
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