// utils/security.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'

// Tipos para permisos
export interface PermissionCheck {
  success: boolean
  error?: string
  data?: any
}

// Verificar si un trainer puede acceder a un cliente específico
export const canTrainerAccessClient = async (
  trainerId: string, 
  clientId: string
): Promise<PermissionCheck> => {
  try {
    // Verificar que el cliente existe y está activo
    const { data: client, error } = await supabase
      .from('profiles')
      .select('id, active, role')
      .eq('id', clientId)
      .eq('role', 'client')
      .single()

    if (error || !client) {
      return { 
        success: false, 
        error: 'Cliente no encontrado o inaccesible' 
      }
    }

    // En este ejemplo asumimos que todos los trainers pueden ver todos los clientes
    // En un sistema real, podrías tener una tabla trainer_clients para relaciones específicas
    return { 
      success: true, 
      data: client 
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Error al verificar permisos' 
    }
  }
}

// Verificar si un cliente puede acceder a una rutina específica
export const canClientAccessRoutine = async (
  clientId: string, 
  routineId: string
): Promise<PermissionCheck> => {
  try {
    const { data: routine, error } = await supabase
      .from('routines')
      .select('id, client_id, active')
      .eq('id', routineId)
      .eq('client_id', clientId)
      .single()

    if (error || !routine) {
      return { 
        success: false, 
        error: 'Rutina no encontrada o sin permisos' 
      }
    }

    return { 
      success: true, 
      data: routine 
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Error al verificar permisos' 
    }
  }
}

// Verificar si un trainer puede modificar una rutina
export const canTrainerModifyRoutine = async (
  trainerId: string, 
  routineId: string
): Promise<PermissionCheck> => {
  try {
    const { data: routine, error } = await supabase
      .from('routines')
      .select('id, trainer_id, client_id')
      .eq('id', routineId)
      .eq('trainer_id', trainerId)
      .single()

    if (error || !routine) {
      return { 
        success: false, 
        error: 'Rutina no encontrada o sin permisos de modificación' 
      }
    }

    return { 
      success: true, 
      data: routine 
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Error al verificar permisos' 
    }
  }
}

// Verificar si un trainer puede modificar un plan de comidas
export const canTrainerModifyMealPlan = async (
  trainerId: string, 
  mealPlanId: string
): Promise<PermissionCheck> => {
  try {
    const { data: mealPlan, error } = await supabase
      .from('meal_plans')
      .select('id, trainer_id, client_id')
      .eq('id', mealPlanId)
      .eq('trainer_id', trainerId)
      .single()

    if (error || !mealPlan) {
      return { 
        success: false, 
        error: 'Plan de comidas no encontrado o sin permisos' 
      }
    }

    return { 
      success: true, 
      data: mealPlan 
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Error al verificar permisos' 
    }
  }
}

// Sanitizar entrada de usuario
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remover scripts
    .replace(/<[^>]*>/g, '') // Remover HTML tags
    .substring(0, 1000) // Limitar longitud
}

// Validar URLs de medios de forma segura
export const validateAndSanitizeUrl = (url: string, type: 'video' | 'image'): string | null => {
  if (!url || url.trim() === '') return null
  
  try {
    const urlObj = new URL(url.trim())
    
    // Lista blanca de dominios permitidos
    const allowedDomains = {
      video: ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com'],
      image: ['imgur.com', 'cloudinary.com', 'unsplash.com', 'images.unsplash.com', 'via.placeholder.com']
    }
    
    const isAllowedDomain = allowedDomains[type].some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    )
    
    if (!isAllowedDomain && type === 'image') {
      // Para imágenes, también permitir extensiones válidas
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
      const hasValidExtension = validExtensions.some(ext => 
        urlObj.pathname.toLowerCase().endsWith(ext)
      )
      
      if (!hasValidExtension) {
        return null
      }
    } else if (!isAllowedDomain) {
      return null
    }
    
    // Asegurar HTTPS
    if (urlObj.protocol !== 'https:') {
      urlObj.protocol = 'https:'
    }
    
    return urlObj.toString()
  } catch (error) {
    return null
  }
}

// Verificar límites de recursos por usuario
export const checkResourceLimits = async (userId: string, role: 'trainer' | 'client') => {
  const limits = {
    trainer: {
      clients: 100,
      routinesPerClient: 20,
      exercisesPerRoutine: 50,
      mealPlansPerClient: 50
    },
    client: {
      // Los clientes no tienen límites de creación, solo visualización
    }
  }

  if (role !== 'trainer') return { success: true }

  try {
    // Verificar número de clientes (simplificado - en un sistema real sería más complejo)
    const { count: clientCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('role', 'client')

    if (clientCount && clientCount > limits.trainer.clients) {
      return { 
        success: false, 
        error: `Límite de clientes alcanzado (${limits.trainer.clients})` 
      }
    }

    return { success: true }
  } catch (error) {
    return { success: true } // En caso de error, permitir la operación
  }
}

// Función para limpiar datos sensibles en logs
export const sanitizeForLogging = (data: any): any => {
  if (typeof data !== 'object' || data === null) return data
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth']
  const sanitized = { ...data }
  
  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '***REDACTED***'
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key])
    }
  }
  
  return sanitized
}

// Rate limiting simple (para uso en cliente)
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  constructor(private maxRequests: number = 10, private windowMs: number = 60000) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    let requests = this.requests.get(key) || []
    requests = requests.filter(time => time > windowStart)
    
    if (requests.length >= this.maxRequests) {
      return false
    }
    
    requests.push(now)
    this.requests.set(key, requests)
    return true
  }
  
  clear(key?: string) {
    if (key) {
      this.requests.delete(key)
    } else {
      this.requests.clear()
    }
  }
}

export const rateLimiter = new RateLimiter()

// Función para verificar integridad de datos
export const verifyDataIntegrity = <T extends Record<string, any>>(
  data: T, 
  requiredFields: (keyof T)[]
): { valid: boolean; missingFields: string[] } => {
  const missingFields: string[] = []
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(String(field))
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields
  }
}