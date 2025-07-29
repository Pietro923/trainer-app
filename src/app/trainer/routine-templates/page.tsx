// app/trainer/routine-templates/page.tsx - Gestión de Templates de Rutinas (CORREGIDO)
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase, RoutineTemplateWithExercises, MUSCLE_GROUPS, DIFFICULTY_LEVELS } from '@/lib/supabase'
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
  BookOpen, 
  Dumbbell, 
  Clock, 
  Target,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  Star,
  Users,
  TrendingUp
} from 'lucide-react'

// Extendemos el tipo para incluir exerciseCount calculado
type TemplateWithCount = RoutineTemplateWithExercises & {
  exerciseCount: number
}

export default function RoutineTemplatesPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [routineTemplates, setRoutineTemplates] = useState<TemplateWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMuscleGroup, setFilterMuscleGroup] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    muscle_group: '',
    difficulty_level: '',
    estimated_duration: ''
  })
  const [createLoading, setCreateLoading] = useState(false)

  useEffect(() => {
    if (!user || profile?.role !== 'trainer') {
      router.push('/')
      return
    }
    fetchRoutineTemplates()
  }, [user, profile, router])

  const fetchRoutineTemplates = async () => {
    try {
      // Fetch routine templates with exercises
      const { data, error } = await supabase
        .from('routine_templates')
        .select(`
          *,
          template_exercises(*)
        `)
        .eq('trainer_id', user?.id)
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching routine templates:', error)
      } else {
        // Transform the data to match our types and add exerciseCount
        const templatesWithCount: TemplateWithCount[] = (data || []).map(template => ({
          ...template,
          exercises: template.template_exercises || [], // Mapear template_exercises a exercises
          exerciseCount: template.template_exercises?.length || 0 // Calcular exerciseCount
        }))
        setRoutineTemplates(templatesWithCount)
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
        muscle_group: formData.muscle_group,
        difficulty_level: formData.difficulty_level || null,
        estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null,
        active: true
      }

      const { data, error } = await supabase
        .from('routine_templates')
        .insert([templateData])
        .select()
        .single()

      if (error) {
        console.error('Error creating template:', error)
        alert('Error al crear el template')
      } else {
        // Reset form
        setFormData({
          name: '',
          description: '',
          muscle_group: '',
          difficulty_level: '',
          estimated_duration: ''
        })
        setCreateDialogOpen(false)
        
        // Redirect to edit exercises
        router.push(`/trainer/routine-templates/${data.id}/exercises`)
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
        muscle_group: template.muscle_group,
        difficulty_level: template.difficulty_level,
        estimated_duration: template.estimated_duration,
        active: true
      }

      const { data: createdTemplate, error: templateError } = await supabase
        .from('routine_templates')
        .insert([newTemplate])
        .select()
        .single()

      if (templateError) throw templateError

      // Duplicate exercises if any exist
      if (template.exercises && template.exercises.length > 0) {
        const newExercises = template.exercises.map(exercise => ({
          template_id: createdTemplate.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          rest_time: exercise.rest_time,
          notes: exercise.notes,
          video_url: exercise.video_url,
          image_url: exercise.image_url,
          exercise_order: exercise.exercise_order
        }))

        const { error: insertError } = await supabase
          .from('template_exercises')
          .insert(newExercises)

        if (insertError) throw insertError
      }

      await fetchRoutineTemplates()
    } catch (error) {
      console.error('Error duplicating template:', error)
      alert('Error al duplicar el template')
    }
  }

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`¿Eliminar el template "${templateName}"? Esta acción no se puede deshacer.`)) return

    try {
      const { error } = await supabase
        .from('routine_templates')
        .update({ active: false })
        .eq('id', templateId)

      if (error) {
        console.error('Error deleting template:', error)
        alert('Error al eliminar el template')
      } else {
        await fetchRoutineTemplates()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar el template')
    }
  }

  const filteredTemplates = routineTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesMuscleGroup = filterMuscleGroup === 'all' || template.muscle_group === filterMuscleGroup
    const matchesDifficulty = filterDifficulty === 'all' || template.difficulty_level === filterDifficulty
    
    return matchesSearch && matchesMuscleGroup && matchesDifficulty
  })

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'principiante': return 'bg-green-100 text-green-800 border-green-200'
      case 'intermedio': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'avanzado': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
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
                    Templates de Rutinas
                  </h1>
                  <p className="text-gray-600">Crea y gestiona tus rutinas reutilizables</p>
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
                  <DialogTitle>Crear Nuevo Template de Rutina</DialogTitle>
                  <DialogDescription>
                    Crea un template reutilizable que podrás asignar a múltiples clientes
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="name">Nombre del Template *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ej: Pecho Intenso, Piernas Completo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="muscle_group">Grupo Muscular *</Label>
                      <Select 
                        value={formData.muscle_group} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, muscle_group: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona grupo muscular" />
                        </SelectTrigger>
                        <SelectContent>
                          {MUSCLE_GROUPS.map(group => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="difficulty_level">Dificultad</Label>
                      <Select 
                        value={formData.difficulty_level} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona dificultad" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_LEVELS.map(level => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="estimated_duration">Duración Estimada (min)</Label>
                      <Input
                        id="estimated_duration"
                        type="number"
                        value={formData.estimated_duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: e.target.value }))}
                        placeholder="45"
                        min="1"
                        max="300"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe los objetivos y características de esta rutina..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCreateDialogOpen(false)}
                      disabled={createLoading}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createLoading}
                    >
                      {createLoading ? 'Creando...' : 'Crear y Agregar Ejercicios'}
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
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Templates</CardTitle>
              <BookOpen className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{routineTemplates.length}</div>
              <p className="text-xs text-blue-700 mt-1">Rutinas creadas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Total Ejercicios</CardTitle>
              <Dumbbell className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {routineTemplates.reduce((total, template) => total + template.exerciseCount, 0)}
              </div>
              <p className="text-xs text-green-700 mt-1">En todos los templates</p>
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
                  placeholder="Buscar templates por nombre, descripción o grupo muscular..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterMuscleGroup} onValueChange={setFilterMuscleGroup}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Grupo muscular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los grupos</SelectItem>
                  {MUSCLE_GROUPS.map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Dificultad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las dificultades</SelectItem>
                  {DIFFICULTY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
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
                <BookOpen className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                {searchQuery || filterMuscleGroup !== 'all' || filterDifficulty !== 'all' 
                  ? 'No se encontraron templates' 
                  : 'No hay templates creados'}
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {searchQuery || filterMuscleGroup !== 'all' || filterDifficulty !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Crea tu primer template de rutina para empezar a organizar tus entrenamientos'
                }
              </p>
              {!searchQuery && filterMuscleGroup === 'all' && filterDifficulty === 'all' && (
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
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {template.muscle_group}
                    </Badge>
                    {template.difficulty_level && (
                      <Badge className={getDifficultyColor(template.difficulty_level)}>
                        {template.difficulty_level}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
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
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Dumbbell className="w-4 h-4 mr-2 text-blue-500" />
                        {template.exerciseCount} ejercicios
                      </div>
                      {template.estimated_duration && (
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2 text-green-500" />
                          {template.estimated_duration} min
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/trainer/routine-templates/${template.id}/exercises`)}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                          className="hover:bg-green-50 hover:text-green-600"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id, template.name)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => router.push(`/trainer/routine-templates/${template.id}/exercises`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {template.exerciseCount === 0 ? 'Agregar Ejercicios' : 'Ver Ejercicios'}
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