// lib/supabase.ts - Tipos actualizados para el nuevo sistema
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})

// =============================================================================
// TIPOS BASE
// =============================================================================

export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  role: 'trainer' | 'client'
  active: boolean
  created_at: string
  updated_at: string
}

// =============================================================================
// TIPOS PARA SISTEMA DE TEMPLATES DE RUTINAS
// =============================================================================

export type RoutineTemplate = {
  id: string
  trainer_id: string
  name: string
  description: string | null
  muscle_group: string
  difficulty_level: 'principiante' | 'intermedio' | 'avanzado' | null
  estimated_duration: number | null // minutos
  active: boolean
  created_at: string
  updated_at: string
}

export type TemplateExercise = {
  id: string
  template_id: string
  name: string
  sets: number | null
  reps: string | null
  weight: string | null
  rest_time: string | null
  notes: string | null
  video_url: string | null
  image_url: string | null
  exercise_order: number
  created_at: string
}

export type ClientRoutineAssignment = {
  id: string
  client_id: string
  trainer_id: string
  template_id: string
  week_day: number // 0=Domingo, 1=Lunes, etc.
  assigned_at: string
  active: boolean
  custom_notes: string | null
}

// =============================================================================
// TIPOS PARA SISTEMA DE TEMPLATES DE ALIMENTACIÓN
// =============================================================================

export type MealPlanTemplate = {
  id: string
  trainer_id: string
  name: string
  description: string | null
  goal: 'definicion' | 'volumen' | 'mantenimiento' | 'perdida_peso' | null
  active: boolean
  created_at: string
  updated_at: string
}

export type TemplateMeal = {
  id: string
  template_id: string
  meal_type: 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'colacion'
  name: string
  description: string
  calories: number | null
  macros: {
    protein?: number
    carbs?: number
    fat?: number
  } | null
  meal_order: number
  created_at: string
}

export type ClientMealAssignment = {
  id: string
  client_id: string
  trainer_id: string
  template_id: string
  assigned_at: string
  active: boolean
  custom_notes: string | null
}

// =============================================================================
// TIPOS COMPUESTOS PARA VISTAS COMPLEJAS
// =============================================================================

export type RoutineTemplateWithExercises = RoutineTemplate & {
  exercises: TemplateExercise[]
}

export type MealPlanTemplateWithMeals = MealPlanTemplate & {
  meals: TemplateMeal[]
}

export type ClientRoutineAssignmentWithTemplate = ClientRoutineAssignment & {
  template: RoutineTemplateWithExercises
}

export type ClientMealAssignmentWithTemplate = ClientMealAssignment & {
  template: MealPlanTemplateWithMeals
}

// Vista completa para el cliente
export type ClientDayView = {
  day: number
  routines: ClientRoutineAssignmentWithTemplate[]
  meals: ClientMealAssignmentWithTemplate[]
}

// =============================================================================
// TIPOS PARA ESTADÍSTICAS Y DASHBOARDS
// =============================================================================

export type TrainerStats = {
  totalClients: number
  activeClients: number
  totalRoutineTemplates: number
  totalMealTemplates: number
  totalAssignments: number
}

export type ClientStats = {
  assignedRoutines: number
  assignedMealPlans: number
  completedWorkouts?: number
  weeklyProgress?: number
}

// =============================================================================
// TIPOS PARA FORMULARIOS Y VALIDACIÓN
// =============================================================================

export type CreateRoutineTemplateData = {
  name: string
  description?: string
  muscle_group: string
  difficulty_level?: 'principiante' | 'intermedio' | 'avanzado'
  estimated_duration?: number
}

export type CreateTemplateExerciseData = {
  template_id: string
  name: string
  sets?: number
  reps?: string
  weight?: string
  rest_time?: string
  notes?: string
  video_url?: string
  image_url?: string
  exercise_order: number
}

export type CreateMealPlanTemplateData = {
  name: string
  description?: string
  goal?: 'definicion' | 'volumen' | 'mantenimiento' | 'perdida_peso'
}

export type CreateTemplateMealData = {
  template_id: string
  meal_type: 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'colacion'
  name: string
  description: string
  calories?: number
  macros?: {
    protein?: number
    carbs?: number
    fat?: number
  }
  meal_order: number
}

export type AssignRoutineToClientData = {
  client_id: string
  template_id: string
  week_day: number
  custom_notes?: string
}

export type AssignMealPlanToClientData = {
  client_id: string
  template_id: string
  custom_notes?: string
}

// =============================================================================
// TIPOS LEGACY (MANTENIDOS PARA COMPATIBILIDAD TEMPORAL)
// =============================================================================

// Mantenemos los tipos antiguos por si necesitamos acceder a datos de respaldo
export type Routine = {
  id: string
  client_id: string
  trainer_id: string
  week_day: number
  muscle_group: string
  name: string
  active: boolean
  created_at: string
  updated_at: string
}

export type Exercise = {
  id: string
  routine_id: string
  name: string
  sets: number | null
  reps: string | null
  weight: string | null
  rest_time: string | null
  notes: string | null
  video_url: string | null
  image_url: string | null
  exercise_order: number
  created_at: string
}

export type MealPlan = {
  id: string
  client_id: string
  trainer_id: string
  day_of_week: number
  meal_type: 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'colacion'
  description: string
  active: boolean
  created_at: string
}

// =============================================================================
// CONSTANTES ÚTILES
// =============================================================================

export const DIFFICULTY_LEVELS = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' }
] as const

export const MEAL_GOALS = [
  { value: 'definicion', label: 'Definición' },
  { value: 'volumen', label: 'Volumen' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'perdida_peso', label: 'Pérdida de Peso' }
] as const

export const MUSCLE_GROUPS = [
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
] as const

export const MEAL_TYPES = [
  { value: 'desayuno', label: 'Desayuno', order: 1 },
  { value: 'colacion', label: 'Colación', order: 2 },
  { value: 'almuerzo', label: 'Almuerzo', order: 3 },
  { value: 'merienda', label: 'Merienda', order: 4 },
  { value: 'cena', label: 'Cena', order: 5 }
] as const

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' }
] as const