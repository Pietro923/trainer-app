// components/CreateExerciseForm.tsx - VERSIÓN ROBUSTA FINAL
/* eslint-disable @typescript-eslint/no-explicit-any */
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

  // Función para validar URLs
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true
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

    // Validar URLs
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
      console.log('=== CREATING EXERCISE (ROBUST VERSION) ===')
      console.log('Form data:', formData)

      // Construir objeto dinámicamente para evitar campos undefined
      const exerciseData: any = {
        routine_id: routineId,
        name: formData.name.trim(),
        exercise_order: nextOrder
      }

      // Solo agregar campos si tienen valor
      if (formData.sets && formData.sets.trim()) {
        exerciseData.sets = parseInt(formData.sets)
      }

      if (formData.reps && formData.reps.trim()) {
        exerciseData.reps = formData.reps.trim()
      }

      if (formData.weight && formData.weight.trim()) {
        exerciseData.weight = formData.weight.trim()
      }

      if (formData.rest_time && formData.rest_time.trim()) {
        exerciseData.rest_time = formData.rest_time.trim()
      }

      if (formData.notes && formData.notes.trim()) {
        exerciseData.notes = formData.notes.trim()
      }

      if (formData.video_url && formData.video_url.trim()) {
        exerciseData.video_url = formData.video_url.trim()
      }

      if (formData.image_url && formData.image_url.trim()) {
        exerciseData.image_url = formData.image_url.trim()
      }

      console.log('Clean exercise data:', exerciseData)
      
      // TIMEOUT de 10 segundos para evitar cuelgues infinitos
      const insertPromise = supabase
        .from('exercises')
        .insert([exerciseData])
        .select()

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('La operación tardó más de 10 segundos. Intenta de nuevo.'))
        }, 10000)
      })

      console.log('Starting insert with timeout...')
      const startTime = Date.now()
      
      const result = await Promise.race([insertPromise, timeoutPromise])
      
      const duration = Date.now() - startTime
      console.log(`Insert completed in ${duration}ms`)
      console.log('Insert result:', result)

      // Type assertion to expected Supabase response type
      type SupabaseInsertResult = {
        data: any[] | null
        error: { message: string } | null
      }
      const typedResult = result as SupabaseInsertResult

      if (typedResult.error) {
        console.error('Insert error:', typedResult.error)
        throw new Error(`Error de base de datos: ${typedResult.error.message}`)
      }

      if (!typedResult.data || typedResult.data.length === 0) {
        throw new Error('No se pudo crear el ejercicio')
      }

      console.log('Exercise created successfully:', typedResult.data[0])
      
      showSuccess('¡Ejercicio agregado exitosamente!')
      
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
      
      console.log('Calling onExerciseCreated...')
      onExerciseCreated()
      console.log('onExerciseCreated completed')
      
    } catch (error: any) {
      console.error('Error creating exercise:', error)
      
      let errorMessage = 'Error desconocido'
      if (error.message.includes('tardó más de 10 segundos')) {
        errorMessage = 'La operación tardó demasiado. Revisa tu conexión e intenta de nuevo.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      showError(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-4">
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
              className={formData.video_url && !isValidUrl(formData.video_url) ? 'border-orange-500' : ''}
            />
            {formData.video_url && !isValidUrl(formData.video_url) && (
              <p className="text-sm text-orange-600 mt-1">URL no válida</p>
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
              className={formData.image_url && !isValidUrl(formData.image_url) ? 'border-orange-500' : ''}
            />
            {formData.image_url && !isValidUrl(formData.image_url) && (
              <p className="text-sm text-orange-600 mt-1">URL no válida</p>
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
            disabled={
              !!loading ||
              (!!formData.video_url && !isValidUrl(formData.video_url)) ||
              (!!formData.image_url && !isValidUrl(formData.image_url))
            }
          >
            {loading ? 'Agregando...' : 'Agregar Ejercicio'}
          </Button>
        </div>
      </form>

      {/* Status indicator con timeout visual */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Creando ejercicio... (máximo 10 segundos)</span>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Si se queda cargando, refresca la página e intenta de nuevo.
          </div>
        </div>
      )}
    </div>
  )
}