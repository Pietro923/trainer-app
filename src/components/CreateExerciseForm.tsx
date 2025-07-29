// components/CreateExerciseForm.tsx - VERSION QUE SÍ FUNCIONA
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
  
  const [loading, setLoading] = useState(false)
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

  // Función simple para validar URLs
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true // URLs vacías son válidas
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      showError('Usuario no autenticado')
      return
    }

    if (!formData.name.trim()) {
      showError('El nombre del ejercicio es requerido')
      return
    }

    // Validar URLs antes de enviar
    if (formData.video_url && !isValidUrl(formData.video_url)) {
      showError('La URL del video no es válida')
      return
    }

    if (formData.image_url && !isValidUrl(formData.image_url)) {
      showError('La URL de la imagen no es válida')
      return
    }

    setLoading(true)
    
    try {
      console.log('=== CREANDO EJERCICIO (VERSIÓN SIMPLE) ===')
      console.log('User ID:', user.id)
      console.log('Routine ID:', routineId)
      console.log('Form data:', formData)
      console.log('Next order:', nextOrder)

      const exerciseData = {
        routine_id: routineId,
        name: formData.name.trim(),
        sets: formData.sets ? parseInt(formData.sets) : null,
        reps: formData.reps.trim() || null,
        weight: formData.weight.trim() || null,
        rest_time: formData.rest_time.trim() || null,
        notes: formData.notes.trim() || null,
        video_url: formData.video_url.trim() || null,
        image_url: formData.image_url.trim() || null,
        exercise_order: nextOrder
      }

      console.log('Data to insert:', exerciseData)
      
      // INSERT SIMPLE SIN TIMEOUT COMPLICADO
      const { data, error } = await supabase
        .from('exercises')
        .insert([exerciseData])
        .select()

      console.log('Supabase response:', { data, error })

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Error de base de datos: ${error.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('No se pudo crear el ejercicio')
      }

      console.log('Exercise created successfully:', data[0])
      
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
      
      // Notificar al padre
      onExerciseCreated()
      
    } catch (error) {
      console.error('Error completo:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      showError(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
            required
            disabled={loading}
          />
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
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="reps">Repeticiones</Label>
          <Input
            id="reps"
            type="text"
            value={formData.reps}
            onChange={(e) => handleInputChange('reps', e.target.value)}
            placeholder="Ej: 8-10, 12, al fallo"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="weight">Peso</Label>
          <Input
            id="weight"
            type="text"
            value={formData.weight}
            onChange={(e) => handleInputChange('weight', e.target.value)}
            placeholder="Ej: 80kg, Peso corporal"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="restTime">Tiempo de Descanso</Label>
          <Input
            id="restTime"
            type="text"
            value={formData.rest_time}
            onChange={(e) => handleInputChange('rest_time', e.target.value)}
            placeholder="Ej: 2-3 min, 60 seg"
            disabled={loading}
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
          disabled={loading}
        />
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
            disabled={loading}
            className={formData.video_url && !isValidUrl(formData.video_url) ? 'border-red-500' : ''}
          />
          {formData.video_url && !isValidUrl(formData.video_url) && (
            <p className="text-sm text-red-600 mt-1">URL no válida</p>
          )}
        </div>

        <div>
          <Label htmlFor="imageUrl">URL de la Imagen (opcional)</Label>
          <Input
            id="imageUrl"
            type="url"
            value={formData.image_url}
            onChange={(e) => handleInputChange('image_url', e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            disabled={loading}
            className={formData.image_url && !isValidUrl(formData.image_url) ? 'border-red-500' : ''}
          />
          {formData.image_url && !isValidUrl(formData.image_url) && (
            <p className="text-sm text-red-600 mt-1">URL no válida</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={loading || 
            (formData.video_url && !isValidUrl(formData.video_url)) ||
            (formData.image_url && !isValidUrl(formData.image_url))
          }
        >
          {loading ? 'Agregando...' : 'Agregar Ejercicio'}
        </Button>
      </div>
    </form>
  )
}