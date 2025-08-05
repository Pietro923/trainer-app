// components/forms/CreateRoutineForm.tsx
'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useSupabaseOperation } from '@/hooks/useAsyncOperation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InlineLoading } from '@/components/InlineLoading'
import { routineSchema, useValidation, sanitizeInput } from '@/lib/validations'

interface CreateRoutineFormProps {
  clientId: string
  onRoutineCreated: () => void
  onCancel?: () => void
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
]

const MUSCLE_GROUPS = [
  'Pecho',
  'Espalda', 
  'Piernas',
  'Hombros',
  'Brazos',
  'Bíceps',
  'Tríceps',
  'Abdominales',
  'Glúteos',
  'Pantorrillas',
  'Cardio',
  'Cuerpo Completo',
  'Funcional',
  'Flexibilidad',
]

export default function CreateRoutineForm({ 
  clientId, 
  onRoutineCreated,
  onCancel 
}: CreateRoutineFormProps) {
  const { user } = useAuth()
  const { success: showSuccess, error: showError } = useToast()
  const createOperation = useSupabaseOperation()
  
  const [formData, setFormData] = useState({
    name: '',
    week_day: '',
    muscle_group: ''
  })

  const { errors, validate, validateField, clearErrors } = useValidation(routineSchema)

  const handleInputChange = useCallback((field: string, value: string) => {
    const sanitizedValue = field === 'name' ? sanitizeInput(value) : value
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }))
    
    // Validación en tiempo real
    if (field === 'week_day') {
      validateField(field, value ? parseInt(value) : null)
    } else {
      validateField(field, sanitizedValue)
    }
  }, [validateField])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      showError('Usuario no autenticado')
      return
    }

    // Preparar datos para validación
    const dataToValidate = {
      ...formData,
      week_day: formData.week_day ? parseInt(formData.week_day) : null
    }

    const validation = validate(dataToValidate)
    
    if (!validation.success) {
      showError('Por favor corrige los errores en el formulario')
      return
    }

    try {
      await createOperation.executeSupabase(async () => {
        return supabase
          .from('routines')
          .insert([{
            client_id: clientId,
            trainer_id: user.id,
            week_day: validation.data!.week_day,
            muscle_group: validation.data!.muscle_group,
            name: validation.data!.name,
            active: true
          }])
          .select()
      })

      showSuccess('Rutina creada exitosamente')
      
      // Limpiar formulario
      setFormData({
        name: '',
        week_day: '',
        muscle_group: ''
      })
      clearErrors()
      
      onRoutineCreated()
    } catch (error) {
      showError('Error al crear rutina')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="routineName">Nombre de la Rutina *</Label>
        <Input
          id="routineName"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Ej: Entrenamiento de Pecho Intenso"
          className={errors.name ? 'border-orange-500' : ''}
          required
        />
        {errors.name && (
          <p className="text-sm text-orange-600 mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="weekDay">Día de la Semana *</Label>
        <Select 
          value={formData.week_day} 
          onValueChange={(value) => handleInputChange('week_day', value)}
        >
          <SelectTrigger className={errors.week_day ? 'border-orange-500' : ''}>
            <SelectValue placeholder="Selecciona un día" />
          </SelectTrigger>
          <SelectContent>
            {DAYS_OF_WEEK.map(day => (
              <SelectItem key={day.value} value={day.value.toString()}>
                {day.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.week_day && (
          <p className="text-sm text-orange-600 mt-1">{errors.week_day}</p>
        )}
      </div>

      <div>
        <Label htmlFor="muscleGroup">Grupo Muscular *</Label>
        <Select 
          value={formData.muscle_group} 
          onValueChange={(value) => handleInputChange('muscle_group', value)}
        >
          <SelectTrigger className={errors.muscle_group ? 'border-orange-500' : ''}>
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
        {errors.muscle_group && (
          <p className="text-sm text-orange-600 mt-1">{errors.muscle_group}</p>
        )}
      </div>

      {createOperation.loading && (
        <InlineLoading message="Creando rutina..." />
      )}

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={createOperation.loading}
          >
            Cancelar
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={createOperation.loading}
        >
          {createOperation.loading ? 'Creando...' : 'Crear Rutina'}
        </Button>
      </div>
    </form>
  )
}