// components/CreateRoutineForm.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

type CreateRoutineFormProps = {
  clientId: string
  onRoutineCreated: () => void
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

export default function CreateRoutineForm({ clientId, onRoutineCreated }: CreateRoutineFormProps) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [weekDay, setWeekDay] = useState<number | null>(null)
  const [muscleGroup, setMuscleGroup] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (weekDay === null) {
      setError('Por favor selecciona un día de la semana')
      setLoading(false)
      return
    }

    try {
      const { error: insertError } = await supabase
        .from('routines')
        .insert([
          {
            client_id: clientId,
            trainer_id: user?.id,
            week_day: weekDay,
            muscle_group: muscleGroup,
            name: name,
            active: true,
          },
        ])

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      // Limpiar formulario y notificar éxito
      setName('')
      setWeekDay(null)
      setMuscleGroup('')
      onRoutineCreated()
      
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="routineName">Nombre de la Rutina</Label>
        <Input
          id="routineName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Entrenamiento de Pecho Intenso"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="weekDay">Día de la Semana</Label>
        <Select value={weekDay?.toString()} onValueChange={(value) => setWeekDay(parseInt(value))}>
          <SelectTrigger>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="muscleGroup">Grupo Muscular</Label>
        <Select value={muscleGroup} onValueChange={setMuscleGroup}>
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

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Rutina'}
        </Button>
      </div>
    </form>
  )
}