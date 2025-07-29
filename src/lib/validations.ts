// lib/validations.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import { useState, useCallback } from 'react'

// Validaciones comunes
const urlSchema = z.string().url('URL inválida').optional().or(z.literal(''))
const emailSchema = z.string().email('Email inválido')
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')

// Función para sanitizar entrada de usuario
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remover scripts
    .replace(/<[^>]*>/g, '') // Remover HTML tags
    .substring(0, 1000) // Limitar longitud
}

// Esquemas para autenticación
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Contraseña requerida')
})

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100, 'Nombre muy largo'),
  role: z.enum(['trainer', 'client'])
})

// Esquemas para ejercicios
export const exerciseSchema = z.object({
  name: z.string()
    .min(1, 'Nombre del ejercicio requerido')
    .max(100, 'Nombre muy largo'),
  sets: z.number()
    .min(1, 'Mínimo 1 serie')
    .max(20, 'Máximo 20 series')
    .optional()
    .nullable(),
  reps: z.string()
    .max(50, 'Descripción de repeticiones muy larga')
    .optional()
    .nullable(),
  weight: z.string()
    .max(30, 'Descripción de peso muy larga')
    .optional()
    .nullable(),
  rest_time: z.string()
    .max(30, 'Descripción de descanso muy larga')
    .optional()
    .nullable(),
  notes: z.string()
    .max(1000, 'Notas muy largas')
    .optional()
    .nullable(),
  video_url: urlSchema,
  image_url: urlSchema,
  exercise_order: z.number().min(0, 'Orden debe ser positivo')
})

export const createExerciseSchema = exerciseSchema.omit({ exercise_order: true })
export const updateExerciseSchema = exerciseSchema.partial()

// Esquemas para rutinas
export const routineSchema = z.object({
  name: z.string()
    .min(1, 'Nombre de rutina requerido')
    .max(100, 'Nombre muy largo'),
  week_day: z.number()
    .min(0, 'Día inválido')
    .max(6, 'Día inválido'),
  muscle_group: z.string()
    .min(1, 'Grupo muscular requerido')
    .max(50, 'Grupo muscular muy largo'),
  active: z.boolean().default(true)
})

export const updateRoutineSchema = routineSchema.partial()

// Esquemas para planes de comida
export const mealPlanSchema = z.object({
  day_of_week: z.number()
    .min(0, 'Día inválido')
    .max(6, 'Día inválido'),
  meal_type: z.enum(['desayuno', 'colacion', 'almuerzo', 'merienda', 'cena'], {
    message: 'Tipo de comida inválido'
  }),
  description: z.string()
    .min(10, 'Descripción debe tener al menos 10 caracteres')
    .max(2000, 'Descripción muy larga'),
  active: z.boolean().default(true)
})

export const updateMealPlanSchema = mealPlanSchema.partial()

// Esquemas para perfiles
export const profileSchema = z.object({
  full_name: z.string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre muy largo'),
  email: emailSchema,
  role: z.enum(['trainer', 'client']),
  active: z.boolean()
})

export const updateProfileSchema = profileSchema.partial()

// Esquema para crear cliente (por parte del trainer)
export const createClientSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre muy largo')
})

// Funciones de validación
export const validateExercise = (data: unknown) => {
  return exerciseSchema.safeParse(data)
}

export const validateRoutine = (data: unknown) => {
  return routineSchema.safeParse(data)
}

export const validateMealPlan = (data: unknown) => {
  return mealPlanSchema.safeParse(data)
}

export const validateSignIn = (data: unknown) => {
  return signInSchema.safeParse(data)
}

export const validateSignUp = (data: unknown) => {
  return signUpSchema.safeParse(data)
}

// Tipos derivados de los esquemas
export type SignInData = z.infer<typeof signInSchema>
export type SignUpData = z.infer<typeof signUpSchema>
export type ExerciseData = z.infer<typeof exerciseSchema>
export type CreateExerciseData = z.infer<typeof createExerciseSchema>
export type RoutineData = z.infer<typeof routineSchema>
export type MealPlanData = z.infer<typeof mealPlanSchema>
export type CreateClientData = z.infer<typeof createClientSchema>

// Utilidad para formatear errores de validación
export const formatValidationErrors = (error: z.ZodError) => {
  return error.issues.reduce((acc, curr) => {
    const path = curr.path.join('.')
    acc[path] = curr.message
    return acc
  }, {} as Record<string, string>)
}

// Utilidad para validar URLs de medios
export const validateMediaUrl = (url: string, type: 'video' | 'image') => {
  if (!url) return true // URLs vacías son válidas (opcional)
  
  try {
    const urlObj = new URL(url)
    
    if (type === 'video') {
      // Validar URLs de video (YouTube, Vimeo, etc.)
      const validVideoHosts = ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com']
      return validVideoHosts.some(host => urlObj.hostname.includes(host))
    }
    
    if (type === 'image') {
      // Validar URLs de imagen
      const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
      return validImageExtensions.some(ext => urlObj.pathname.toLowerCase().includes(ext)) ||
             urlObj.hostname.includes('imgur.com') ||
             urlObj.hostname.includes('cloudinary.com') ||
             urlObj.hostname.includes('unsplash.com')
    }
    
    return true
  } catch {
    return false
  }
}

// Hook para validación en tiempo real
export const useValidation = <T extends z.ZodType>(schema: T) => {
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const validate = useCallback((data: unknown) => {
    const result = schema.safeParse(data)
    
    if (result.success) {
      setErrors({})
      return { success: true as const, data: result.data, errors: {} }
    } else {
      const formattedErrors = formatValidationErrors(result.error)
      setErrors(formattedErrors)
      return { success: false as const, data: null, errors: formattedErrors }
    }
  }, [schema])
  
  const validateField = useCallback((fieldName: string, value: unknown) => {
    try {
      // Validar solo un campo específico
      const fieldSchema = (schema as any).shape?.[fieldName]
      if (fieldSchema) {
        fieldSchema.parse(value)
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[fieldName]
          return newErrors
        })
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: error.issues[0]?.message || 'Error de validación'
        }))
      }
    }
  }, [schema])
  
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])
  
  return {
    errors,
    validate,
    validateField,
    clearErrors,
    hasErrors: Object.keys(errors).length > 0
  }
}