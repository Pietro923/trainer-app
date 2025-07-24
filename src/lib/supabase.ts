// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export type Profile = {
  client: any
  id: string
  email: string | null
  full_name: string | null
  role: 'trainer' | 'client'
  active: boolean
  created_at: string
  updated_at: string
}

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