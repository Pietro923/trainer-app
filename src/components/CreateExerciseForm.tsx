// components/forms/CreateExerciseForm.tsx
'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useSupabaseOperation } from '@/hooks/useAsyncOperation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { InlineLoading } from '@/components/InlineLoading'
import { 
  exerciseSchema, 
  useValidation, 
  validateMediaUrl,
  sanitizeInput 
} from '@/lib/validations'

interface CreateExerciseFormProps {
  routineId: string
  nextOrder: number
  onExerciseCreated: () => void
  onCancel?: () => void
}

export default function CreateExerciseForm({ 
  routineId, 
  nextOrder, 
  onExerciseCreated,
  onCancel 
}: CreateExerciseFormProps) {
  const { user } = useAuth()
  const { success: showSuccess, error: showError } = useToast()
  const createOperation = useSupabaseOperation()
  
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

  const { errors, validate, validateField, clearErrors } = useValidation(exerciseSchema)

  const handleInputChange = useCallback((field: string, value: string) => {
    const sanitizedValue = sanitizeInput(value)
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }))
    
    // Validación en tiempo real
    if (field === 'video_url' && value) {
      if (!validateMediaUrl(value, 'video')) {
        validateField(field, 'URL de video inválida')
        return
      }
    }
    
    if (field === 'image_url' && value) {
      if (!validateMediaUrl(value, 'image')) {
        validateField(field, 'URL de imagen inválida')
        return
      }
    }
    
    validateField(field, field === 'sets' ? (value ? parseInt(value) : null) : value)
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
      sets: formData.sets ? parseInt(formData.sets) : null,
      exercise_order: nextOrder
    }

    const validation = validate(dataToValidate)
    
    if (!validation.success) {
      showError('Por favor corrige los errores en el formulario')
      return
    }

    try {
      await createOperation.executeSupabase(async () => {
        return supabase
          .from('exercises')
          .insert([{
            routine_id: routineId,
            name: validation.data!.name,
            sets: validation.data!.sets,
            reps: validation.data!.reps || null,
            weight: validation.data!.weight || null,
            rest_time: validation.data!.rest_time || null,
            notes: validation.data!.notes || null,
            video_url: validation.data!.video_url || null,
            image_url: validation.data!.image_url || null,
            exercise_order: nextOrder
          }])
          .select()
      })

      showSuccess('Ejercicio agregado exitosamente')
      
      // Limpiar formulario
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
      clearErrors()
      
      onExerciseCreated()
    } catch (error) {
      showError('Error al agregar ejercicio')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="exerciseName">
            Nombre del Ejercicio *
          </Label>
          <Input
            id="exerciseName"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Ej: Press de banca con barra"
            className={errors.name ? 'border-red-500' : ''}
            required
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="sets">Series</Label>
          <Input
            id="sets"
            type="number"
            value={formData.sets}
            onChange={(e) => handleInputChange('sets', e.target.value)}
            placeholder="Ej: 4"
            min="1"
            max="20"
            className={errors.sets ? 'border-red-500' : ''}
          />
          {errors.sets && (
            <p className="text-sm text-red-600 mt-1">{errors.sets}</p>
          )}
        </div>

        <div>
          <Label htmlFor="reps">Repeticiones</Label>
          <Input
            id="reps"
            type="text"
            value={formData.reps}
            onChange={(e) => handleInputChange('reps', e.target.value)}
            placeholder="Ej: 8-10, 12, al fallo"
            className={errors.reps ? 'border-red-500' : ''}
          />
          {errors.reps && (
            <p className="text-sm text-red-600 mt-1">{errors.reps}</p>
          )}
        </div>

        <div>
          <Label htmlFor="weight">Peso</Label>
          <Input
            id="weight"
            type="text"
            value={formData.weight}
            onChange={(e) => handleInputChange('weight', e.target.value)}
            placeholder="Ej: 80kg, Peso corporal"
            className={errors.weight ? 'border-red-500' : ''}
          />
          {errors.weight && (
            <p className="text-sm text-red-600 mt-1">{errors.weight}</p>
          )}
        </div>

        <div>
          <Label htmlFor="restTime">Tiempo de Descanso</Label>
          <Input
            id="restTime"
            type="text"
            value={formData.rest_time}
            onChange={(e) => handleInputChange('rest_time', e.target.value)}
            placeholder="Ej: 2-3 min, 60 seg"
            className={errors.rest_time ? 'border-red-500' : ''}
          />
          {errors.rest_time && (
            <p className="text-sm text-red-600 mt-1">{errors.rest_time}</p>
          )}
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
          className={errors.notes ? 'border-red-500' : ''}
        />
        {errors.notes && (
          <p className="text-sm text-red-600 mt-1">{errors.notes}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="videoUrl">URL del Video (opcional)</Label>
          <Input
            id="videoUrl"
            type="url"
            value={formData.video_url}
            onChange={(e) => handleInputChange('video_url', e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className={errors.video_url ? 'border-red-500' : ''}
          />
          {errors.video_url && (
            <p className="text-sm text-red-600 mt-1">{errors.video_url}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Soportado: YouTube, Vimeo, Dailymotion
          </p>
        </div>

        <div>
          <Label htmlFor="imageUrl">URL de la Imagen (opcional)</Label>
          <Input
            id="imageUrl"
            type="url"
            value={formData.image_url}
            onChange={(e) => handleInputChange('image_url', e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            className={errors.image_url ? 'border-red-500' : ''}
          />
          {errors.image_url && (
            <p className="text-sm text-red-600 mt-1">{errors.image_url}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Formatos: JPG, PNG, GIF, WebP, SVG
          </p>
        </div>
      </div>

      {createOperation.loading && (
        <InlineLoading message="Agregando ejercicio..." />
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
          {createOperation.loading ? 'Agregando...' : 'Agregar Ejercicio'}
        </Button>
      </div>
    </form>
  )
}