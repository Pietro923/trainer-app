// components/EditExerciseForm.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { supabase, Exercise } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

type EditExerciseFormProps = {
  exercise: Exercise
  onExerciseUpdated: () => void
}

export default function EditExerciseForm({ exercise, onExerciseUpdated }: EditExerciseFormProps) {
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

  // Cargar los datos del ejercicio cuando cambie
  useEffect(() => {
    if (exercise) {
      setName(exercise.name || '')
      setSets(exercise.sets?.toString() || '')
      setReps(exercise.reps || '')
      setWeight(exercise.weight || '')
      setRestTime(exercise.rest_time || '')
      setNotes(exercise.notes || '')
      setVideoUrl(exercise.video_url || '')
      setImageUrl(exercise.image_url || '')
    }
  }, [exercise])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('exercises')
        .update({
          name: name,
          sets: sets ? parseInt(sets) : null,
          reps: reps || null,
          weight: weight || null,
          rest_time: restTime || null,
          notes: notes || null,
          video_url: videoUrl || null,
          image_url: imageUrl || null,
        })
        .eq('id', exercise.id)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      onExerciseUpdated()
      
    } catch (error: any) {
      setError(error.message)
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
          />
        </div>

        <div>
          <Label htmlFor="imageUrl">URL de la Imagen (opcional)</Label>
          <Input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar Ejercicio'}
        </Button>
      </div>
    </form>
  )
}