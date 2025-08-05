// app/trainer/client/[clientId]/assign-meals/page.tsx - Asignar Planes Alimenticios a Cliente
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { supabase, Profile, MealPlanTemplate, ClientMealAssignment } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Plus, 
  Utensils, 
  Apple, 
  Target,
  User,
  Trash2,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react'

type MealPlanTemplateWithMeals = MealPlanTemplate & {
  mealCount?: number
}

type ClientMealAssignmentWithTemplate = ClientMealAssignment & {
  template: MealPlanTemplate
}

export default function AssignMealsPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const clientId = params.clientId as string
  
  const [client, setClient] = useState<Profile | null>(null)
  const [mealTemplates, setMealTemplates] = useState<MealPlanTemplateWithMeals[]>([])
  const [currentAssignments, setCurrentAssignments] = useState<ClientMealAssignmentWithTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [customNotes, setCustomNotes] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)

  useEffect(() => {
    if (!user || profile?.role !== 'trainer') {
      router.push('/')
      return
    }
    fetchData()
  }, [user, profile, router, clientId])

  const fetchData = async () => {
    try {
      // Fetch client data
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) {
        console.error('Error fetching client:', clientError)
        router.push('/trainer/dashboard')
        return
      }

      // Fetch meal plan templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('meal_plan_templates')
        .select(`
          *,
          template_meals(id)
        `)
        .eq('trainer_id', user?.id)
        .eq('active', true)
        .order('name')

      if (templatesError) {
        console.error('Error fetching templates:', templatesError)
      }

      // Fetch current assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('client_meal_assignments')
        .select(`
          *,
          template:meal_plan_templates(*)
        `)
        .eq('client_id', clientId)
        .eq('trainer_id', user?.id)
        .eq('active', true)

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError)
      }

      setClient(clientData)
      setMealTemplates((templatesData || []).map(template => ({
        ...template,
        mealCount: template.template_meals?.length || 0
      })))
      setCurrentAssignments(assignmentsData || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignMealPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setAssignLoading(true)

    try {
      // Check if there's already an active assignment
      const existingAssignment = currentAssignments.find(assignment => assignment.active)

      if (existingAssignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('client_meal_assignments')
          .update({
            template_id: selectedTemplate,
            custom_notes: customNotes || null,
          })
          .eq('id', existingAssignment.id)

        if (error) throw error
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('client_meal_assignments')
          .insert([{
            client_id: clientId,
            trainer_id: user?.id,
            template_id: selectedTemplate,
            custom_notes: customNotes || null,
            active: true
          }])

        if (error) throw error
      }

      // Reset form and refresh data
      setSelectedTemplate('')
      setCustomNotes('')
      setAssignDialogOpen(false)
      await fetchData()
    } catch (error) {
      console.error('Error assigning meal plan:', error)
      alert('Error al asignar el plan alimenticio')
    } finally {
      setAssignLoading(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('¿Remover el plan alimenticio asignado?')) return

    try {
      const { error } = await supabase
        .from('client_meal_assignments')
        .update({ active: false })
        .eq('id', assignmentId)

      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error removing assignment:', error)
      alert('Error al remover la asignación')
    }
  }

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
    switch (goal) {
      case 'definicion': return 'Definición'
      case 'volumen': return 'Volumen'
      case 'mantenimiento': return 'Mantenimiento'
      case 'perdida_peso': return 'Pérdida de Peso'
      default: return 'Sin objetivo'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando asignaciones...</p>
        </div>
      </div>
    )
  }

  const currentAssignment = currentAssignments.find(assignment => assignment.active)

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
                    Asignar Plan Alimenticio a {client?.full_name}
                  </h1>
                  <p className="text-gray-600">Gestiona el plan nutricional del cliente</p>
                </div>
              </div>
            </div>
            
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg bg-green-600 hover:bg-green-700" disabled={mealTemplates.length === 0}>
                  {currentAssignment ? <Activity className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {currentAssignment ? 'Cambiar Plan' : 'Asignar Plan'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {currentAssignment ? 'Cambiar Plan Alimenticio' : 'Asignar Plan Alimenticio'} a {client?.full_name}
                  </DialogTitle>
                  <DialogDescription>
                    Selecciona un template de alimentación para el cliente
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAssignMealPlan} className="space-y-4">
                  <div>
                    <Label htmlFor="template">Template de Plan Alimenticio *</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un template" />
                      </SelectTrigger>
                      <SelectContent>
                        {mealTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center space-x-2">
                              <span>{template.name}</span>
                              {template.goal && (
                                <Badge variant="outline" className="text-xs">
                                  {getGoalLabel(template.goal)}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notas Personalizadas (opcional)</Label>
                    <Textarea
                      id="notes"
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Instrucciones específicas, alergias, preferencias alimentarias..."
                      rows={3}
                    />
                  </div>

                  {/* Preview del template seleccionado */}
                  {selectedTemplate && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Vista previa del template:</h4>
                      {(() => {
                        const template = mealTemplates.find(t => t.id === selectedTemplate)
                        return template ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Apple className="w-4 h-4 mr-1" />
                                {template.name}
                              </div>
                              <div className="flex items-center">
                                <Utensils className="w-4 h-4 mr-1" />
                                {template.mealCount} comidas
                              </div>
                              {template.goal && (
                                <Badge className={getGoalColor(template.goal)}>
                                  {getGoalLabel(template.goal)}
                                </Badge>
                              )}
                            </div>
                            {template.description && (
                              <p className="text-sm text-gray-600 bg-white p-3 rounded">
                                {template.description}
                              </p>
                            )}
                          </div>
                        ) : null
                      })()}
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setAssignDialogOpen(false)}
                      disabled={assignLoading}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={assignLoading || !selectedTemplate}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {assignLoading ? 'Asignando...' : (currentAssignment ? 'Cambiar Plan' : 'Asignar Plan')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Client Info */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                <User className="w-8 h-8 text-green-700" />
              </div>
              <div>
                <CardTitle className="text-xl">{client?.full_name}</CardTitle>
                <CardDescription className="flex items-center space-x-4">
                  <span>{client?.email}</span>
                  <Badge variant={client?.active ? "default" : "secondary"}>
                    {client?.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Current Assignment */}
       <Card>
  <CardHeader>
    <CardTitle className="flex items-center">
      <Apple className="w-5 h-5 mr-2 text-green-600" />
      Plan Alimenticio Asignado
    </CardTitle>
    <CardDescription>
      {currentAssignment 
        ? 'Plan nutricional activo para el cliente'
        : 'No hay plan alimenticio asignado aún'
      }
    </CardDescription>
  </CardHeader>
  <CardContent>
    {currentAssignment ? (
      <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4 sm:p-6">
        {/* Layout responsive: columna en móvil, fila en desktop */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Información principal */}
          <div className="flex items-start space-x-4 flex-1 min-w-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 break-words">
                {currentAssignment.template.name}
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-3 gap-2">
                {currentAssignment.template.goal && (
                  <Badge className={getGoalColor(currentAssignment.template.goal)}>
                    {getGoalLabel(currentAssignment.template.goal)}
                  </Badge>
                )}
                <span className="text-xs sm:text-sm text-gray-600">
                  Asignado el {new Date(currentAssignment.assigned_at).toLocaleDateString('es-ES')}
                </span>
              </div>
              {currentAssignment.template.description && (
                <p className="text-sm text-gray-700 bg-white p-3 rounded-lg mb-3 break-words">
                  {currentAssignment.template.description}
                </p>
              )}
              {currentAssignment.custom_notes && (
                <div className="bg-white p-3 rounded-lg border-l-4 border-green-500">
                  <p className="text-sm text-gray-700 break-words">
                    <strong className="text-green-700">Notas personalizadas:</strong> {currentAssignment.custom_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Botones - responsive */}
          <div className="flex flex-row sm:flex-col gap-2 lg:flex-col lg:w-auto w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTemplate(currentAssignment.template_id)
                setCustomNotes(currentAssignment.custom_notes || '')
                setAssignDialogOpen(true)
              }}
              className="flex-1 sm:flex-none lg:w-24 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
            >
              <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Cambiar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveAssignment(currentAssignment.id)}
              className="flex-1 sm:flex-none lg:w-24 text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-xs sm:text-sm"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Remover
            </Button>
          </div>
        </div>
      </div>
    ) : (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-3">
          No hay plan alimenticio asignado
        </h3>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Asigna un plan nutricional a {client?.full_name} para ayudarle a alcanzar sus objetivos de salud y fitness
        </p>
        {mealTemplates.length > 0 ? (
          <Button onClick={() => setAssignDialogOpen(true)} size="lg" className="bg-green-600 hover:bg-green-700">
            <Plus className="w-5 h-5 mr-2" />
            Asignar Plan Alimenticio
          </Button>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
              No tienes templates de alimentación creados
            </p>
            <Button 
              onClick={() => router.push('/trainer/meal-templates')} 
              size="lg" 
              variant="outline"
            >
              <Apple className="w-5 h-5 mr-2" />
              Crear Templates de Alimentación
            </Button>
          </div>
        )}
      </div>
    )}
  </CardContent>
</Card>

        {/* Available Templates */}
        {mealTemplates.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Templates Disponibles
              </CardTitle>
              <CardDescription>
                {mealTemplates.length} plan(es) alimenticio(s) disponible(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mealTemplates.map(template => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Alimentación
                        </Badge>
                        {template.goal && (
                          <Badge className={getGoalColor(template.goal)}>
                            {getGoalLabel(template.goal)}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="text-sm line-clamp-2">
                          {template.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <Utensils className="w-4 h-4 mr-1 text-green-500" />
                          {template.mealCount} comidas
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template.id)
                            setAssignDialogOpen(true)
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {currentAssignment?.template_id === template.id ? 'Asignado' : 'Asignar'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}