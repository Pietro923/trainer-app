// app/trainer/client/[clientId]/assign-routines/page.tsx - Asignar Rutinas a Cliente
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { supabase, Profile, RoutineTemplate, ClientRoutineAssignment, DAYS_OF_WEEK } from '@/lib/supabase'
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
  Calendar, 
  Dumbbell, 
  Clock, 
  Target,
  BookOpen,
  User,
  Save,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

type RoutineTemplateWithExercises = RoutineTemplate & {
  exerciseCount?: number
}

type ClientAssignmentWithTemplate = ClientRoutineAssignment & {
  template: RoutineTemplate
}

export default function AssignRoutinesPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const clientId = params.clientId as string
  
  const [client, setClient] = useState<Profile | null>(null)
  const [routineTemplates, setRoutineTemplates] = useState<RoutineTemplateWithExercises[]>([])
  const [currentAssignments, setCurrentAssignments] = useState<ClientAssignmentWithTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedDay, setSelectedDay] = useState<string>('')
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

      // Fetch routine templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('routine_templates')
        .select(`
          *,
          template_exercises(id)
        `)
        .eq('trainer_id', user?.id)
        .eq('active', true)
        .order('name')

      if (templatesError) {
        console.error('Error fetching templates:', templatesError)
      }

      // Fetch current assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('client_routine_assignments')
        .select(`
          *,
          template:routine_templates(*)
        `)
        .eq('client_id', clientId)
        .eq('trainer_id', user?.id)
        .eq('active', true)
        .order('week_day')

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError)
      }

      setClient(clientData)
      setRoutineTemplates((templatesData || []).map(template => ({
        ...template,
        exerciseCount: template.template_exercises?.length || 0
      })))
      setCurrentAssignments(assignmentsData || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignRoutine = async (e: React.FormEvent) => {
    e.preventDefault()
    setAssignLoading(true)

    try {
      // Check if there's already an assignment for this day
      const existingAssignment = currentAssignments.find(
        assignment => assignment.week_day === parseInt(selectedDay)
      )

      if (existingAssignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('client_routine_assignments')
          .update({
            template_id: selectedTemplate,
            custom_notes: customNotes || null,
          })
          .eq('id', existingAssignment.id)

        if (error) throw error
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('client_routine_assignments')
          .insert([{
            client_id: clientId,
            trainer_id: user?.id,
            template_id: selectedTemplate,
            week_day: parseInt(selectedDay),
            custom_notes: customNotes || null,
            active: true
          }])

        if (error) throw error
      }

      // Reset form and refresh data
      setSelectedTemplate('')
      setSelectedDay('')
      setCustomNotes('')
      setAssignDialogOpen(false)
      await fetchData()
    } catch (error) {
      console.error('Error assigning routine:', error)
      alert('Error al asignar la rutina')
    } finally {
      setAssignLoading(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string, dayName: string) => {
    if (!confirm(`¿Remover la rutina asignada para ${dayName}?`)) return

    try {
      const { error } = await supabase
        .from('client_routine_assignments')
        .update({ active: false })
        .eq('id', assignmentId)

      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error removing assignment:', error)
      alert('Error al remover la asignación')
    }
  }

  const getAssignmentForDay = (dayValue: number) => {
    return currentAssignments.find(assignment => assignment.week_day === dayValue)
  }

  const getAvailableDays = () => {
    const assignedDays = currentAssignments.map(assignment => assignment.week_day)
    return DAYS_OF_WEEK.filter(day => !assignedDays.includes(day.value))
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
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Asignar Rutinas a {client?.full_name}
                  </h1>
                  <p className="text-gray-600">Gestiona las rutinas semanales del cliente</p>
                </div>
              </div>
            </div>
            
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg" disabled={getAvailableDays().length === 0}>
                  <Plus className="w-4 h-4 mr-2" />
                  Asignar Rutina
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Asignar Rutina a {client?.full_name}</DialogTitle>
                  <DialogDescription>
                    Selecciona un template de rutina y el día de la semana
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAssignRoutine} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template">Template de Rutina *</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un template" />
                        </SelectTrigger>
                        <SelectContent>
                          {routineTemplates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center space-x-2">
                                <span>{template.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {template.muscle_group}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="day">Día de la Semana *</Label>
                      <Select value={selectedDay} onValueChange={setSelectedDay}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un día" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableDays().map(day => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notas Personalizadas (opcional)</Label>
                    <Textarea
                      id="notes"
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Instrucciones específicas para este cliente..."
                      rows={3}
                    />
                  </div>

                  {/* Preview del template seleccionado */}
                  {selectedTemplate && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Vista previa del template:</h4>
                      {(() => {
                        const template = routineTemplates.find(t => t.id === selectedTemplate)
                        return template ? (
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <BookOpen className="w-4 h-4 mr-1" />
                              {template.name}
                            </div>
                            <div className="flex items-center">
                              <Dumbbell className="w-4 h-4 mr-1" />
                              {template.exerciseCount} ejercicios
                            </div>
                            {template.estimated_duration && (
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {template.estimated_duration} min
                              </div>
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
                      disabled={assignLoading || !selectedTemplate || !selectedDay}
                    >
                      {assignLoading ? 'Asignando...' : 'Asignar Rutina'}
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
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                <User className="w-8 h-8 text-orange-700" />
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

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-orange-600" />
              Rutinas Semanales Asignadas
            </CardTitle>
            <CardDescription>
              {currentAssignments.length > 0 
                ? `${currentAssignments.length} de 7 días tienen rutinas asignadas`
                : 'No hay rutinas asignadas aún'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DAYS_OF_WEEK.map(day => {
                const assignment = getAssignmentForDay(day.value)
                
                return (
                  <div 
                    key={day.value}
                    className={`
                      border-2 rounded-xl p-4 transition-all duration-200
                      ${assignment 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-gray-50 border-dashed'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center
                            ${assignment 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-500'
                            }
                          `}>
                            {assignment ? <CheckCircle className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{day.label}</h3>
                            {assignment ? (
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-green-700">
                                  {assignment.template.name}
                                </p>
                                <div className="flex items-center space-x-3 text-xs text-gray-600">
                                  <span className="bg-white px-2 py-1 rounded-full">
                                    {assignment.template.muscle_group}
                                  </span>
                                  {assignment.template.difficulty_level && (
                                    <span className="bg-white px-2 py-1 rounded-full">
                                      {assignment.template.difficulty_level}
                                    </span>
                                  )}
                                </div>
                                {assignment.custom_notes && (
                                  <p className="text-xs text-gray-600 mt-2 bg-white p-2 rounded">
                                    <strong>Notas:</strong> {assignment.custom_notes}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">Sin rutina asignada</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {assignment ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveAssignment(assignment.id, day.label)}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDay(day.value.toString())
                              setAssignDialogOpen(true)
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Asignar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {currentAssignments.length === 0 && (
              <div className="text-center py-12 mt-8">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  No hay rutinas asignadas
                </h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  Asigna rutinas a {client?.full_name} para que pueda seguir un plan de entrenamiento estructurado
                </p>
                <Button onClick={() => setAssignDialogOpen(true)} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Asignar Primera Rutina
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}