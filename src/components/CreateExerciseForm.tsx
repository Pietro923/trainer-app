// components/CreateExerciseForm.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

type CreateExerciseFormProps = {
  routineId: string
  nextOrder: number
  onExerciseCreated: () => void
}

export default function CreateExerciseForm({ routineId, nextOrder, onExerciseCreated }: CreateExerciseFormProps) {
  const [name, setName] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [restTime, setRestTime] = useState('')
  const [notes, setNotes] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validateUrl = (url: string): boolean => {
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
    e.stopPropagation()
    
    if (loading) return // Prevenir múltiples submits
    
    setLoading(true)
    setError('')

    console.log('Submitting exercise with data:', {
      routineId,
      name,
      sets,
      reps,
      weight,
      restTime,
      notes,
      videoUrl,
      imageUrl,
      nextOrder
    })

    // Validaciones
    if (!name.trim()) {
      setError('El nombre del ejercicio es obligatorio')
      setLoading(false)
      return
    }

    if (videoUrl && !validateUrl(videoUrl)) {
      setError('La URL del video no es válida')
      setLoading(false)
      return
    }

    if (imageUrl && !validateUrl(imageUrl)) {
      setError('La URL de la imagen no es válida')
      setLoading(false)
      return
    }

    try {
      const exerciseData = {
        routine_id: routineId,
        name: name.trim(),
        sets: sets ? parseInt(sets) : null,
        reps: reps.trim() || null,
        weight: weight.trim() || null,
        rest_time: restTime.trim() || null,
        notes: notes.trim() || null,
        video_url: videoUrl.trim() || null,
        image_url: imageUrl.trim() || null,
        exercise_order: nextOrder,
      }

      console.log('Inserting exercise data:', exerciseData)

      const { data, error: insertError } = await supabase
        .from('exercises')
        .insert([exerciseData])
        .select()

      console.log('Insert result:', { data, error: insertError })

      if (insertError) {
        console.error('Database error:', insertError)
        setError(`Error al crear ejercicio: ${insertError.message}`)
        return
      }

      if (!data || data.length === 0) {
        setError('No se pudo crear el ejercicio')
        return
      }

      console.log('Exercise created successfully:', data[0])

      // Limpiar formulario
      setName('')
      setSets('')
      setReps('')
      setWeight('')
      setRestTime('')
      setNotes('')
      setVideoUrl('')
      setImageUrl('')
      
      // Pequeño delay antes de notificar para evitar race conditions
      setTimeout(() => {
        onExerciseCreated()
      }, 100)
      
    } catch (error: any) {
      console.error('Unexpected error:', error)
      setError(`Error inesperado: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="exerciseName">Nombre del Ejercicio *</Label>
          <Input
            id="exerciseName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            placeholder="Ej: 4"
            min="1"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="reps">Repeticiones</Label>
          <Input
            id="reps"
            type="text"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="Ej: 8-10, 12, al fallo"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="weight">Peso</Label>
          <Input
            id="weight"
            type="text"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Ej: 80kg, Peso corporal"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="restTime">Tiempo de Descanso</Label>
          <Input
            id="restTime"
            type="text"
            value={restTime}
            onChange={(e) => setRestTime(e.target.value)}
            placeholder="Ej: 2-3 min, 60 seg"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notas / Instrucciones</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            disabled={loading}
          />
          {videoUrl && !validateUrl(videoUrl) && (
            <p className="text-red-500 text-xs mt-1">URL no válida</p>
          )}
        </div>

        <div>
          <Label htmlFor="imageUrl">URL de la Imagen (opcional)</Label>
          <Input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            disabled={loading}
          />
          {imageUrl && !validateUrl(imageUrl) && (
            <p className="text-red-500 text-xs mt-1">URL no válida</p>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-2">
        <Button
          type="submit"
          disabled={
            !!loading ||
            (!!videoUrl && !validateUrl(videoUrl)) ||
            (!!imageUrl && !validateUrl(imageUrl))
          }
        >
          {loading ? 'Agregando...' : 'Agregar Ejercicio'}
        </Button>
      </div>
    </form>
  )
}