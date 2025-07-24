// components/CreateMealPlanForm.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

type CreateMealPlanFormProps = {
  clientId: string
  onMealCreated: () => void
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

const MEAL_TYPES = [
  { value: 'desayuno', label: 'Desayuno' },
  { value: 'colacion', label: 'Colación' },
  { value: 'almuerzo', label: 'Almuerzo' },
  { value: 'merienda', label: 'Merienda' },
  { value: 'cena', label: 'Cena' },
]

export default function CreateMealPlanForm({ clientId, onMealCreated }: CreateMealPlanFormProps) {
  const { user } = useAuth()
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null)
  const [mealType, setMealType] = useState<string>('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (dayOfWeek === null) {
      setError('Por favor selecciona un día de la semana')
      setLoading(false)
      return
    }

    if (!mealType) {
      setError('Por favor selecciona el tipo de comida')
      setLoading(false)
      return
    }

    try {
      const { error: insertError } = await supabase
        .from('meal_plans')
        .insert([
          {
            client_id: clientId,
            trainer_id: user?.id,
            day_of_week: dayOfWeek,
            meal_type: mealType as 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'colacion',
            description: description,
            active: true,
          },
        ])

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      // Limpiar formulario y notificar éxito
      setDayOfWeek(null)
      setMealType('')
      setDescription('')
      onMealCreated()
      
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dayOfWeek">Día de la Semana *</Label>
          <Select value={dayOfWeek?.toString()} onValueChange={(value) => setDayOfWeek(parseInt(value))}>
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

        <div>
          <Label htmlFor="mealType">Tipo de Comida *</Label>
          <Select value={mealType} onValueChange={setMealType}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el tipo" />
            </SelectTrigger>
            <SelectContent>
              {MEAL_TYPES.map(meal => (
                <SelectItem key={meal.value} value={meal.value}>
                  {meal.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción del Plan Alimenticio *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe detalladamente qué debe comer el cliente..."
          rows={6}
          required
          className="resize-none"
        />
        <p className="text-sm text-gray-500 mt-1">
          Incluye alimentos, porciones, preparación, etc.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Agregando...' : 'Agregar Comida'}
        </Button>
      </div>
    </form>
  )
}