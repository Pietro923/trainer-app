// hooks/useAsyncOperation.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useRef } from 'react'

interface AsyncOperationState<T> {
  loading: boolean
  error: string | null
  data: T | null
  success: boolean
}

interface AsyncOperationOptions {
  timeout?: number
  retryCount?: number
  retryDelay?: number
}

export const useAsyncOperation = <T>(options: AsyncOperationOptions = {}) => {
  const {
    timeout = 10000,
    retryCount = 2,
    retryDelay = 1000
  } = options

  const [state, setState] = useState<AsyncOperationState<T>>({
    loading: false,
    error: null,
    data: null,
    success: false
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)

  const execute = useCallback(async (
    operation: (signal?: AbortSignal) => Promise<T>,
    showLoading = true
  ): Promise<T | null> => {
    // Cancelar operación anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    if (showLoading) {
      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null, 
        success: false 
      }))
    }

    const executeWithTimeout = async (): Promise<T> => {
      return Promise.race([
        operation(signal),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Operación cancelada por timeout')), timeout)
        )
      ])
    }

    const executeWithRetry = async (): Promise<T> => {
      try {
        const result = await executeWithTimeout()
        retryCountRef.current = 0
        return result
      } catch (error) {
        if (signal.aborted) {
          throw new Error('Operación cancelada')
        }

        if (retryCountRef.current < retryCount) {
          retryCountRef.current++
          console.log(`Reintentando operación (${retryCountRef.current}/${retryCount})`)
          
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          
          if (!signal.aborted) {
            return executeWithRetry()
          }
        }
        
        throw error
      }
    }

    try {
      const result = await executeWithRetry()
      
      if (!signal.aborted) {
        setState({
          loading: false,
          error: null,
          data: result,
          success: true
        })
      }
      
      return result
    } catch (err) {
      if (!signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
        setState({
          loading: false,
          error: errorMessage,
          data: null,
          success: false
        })
        
        // Log del error para debugging
        console.error('AsyncOperation Error:', {
          error: err,
          message: errorMessage,
          timestamp: new Date().toISOString(),
          retryCount: retryCountRef.current
        })
      }
      
      throw err
    }
  }, [timeout, retryCount, retryDelay])

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setState({
      loading: false,
      error: null,
      data: null,
      success: false
    })
    retryCountRef.current = 0
  }, [])

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setState(prev => ({
      ...prev,
      loading: false
    }))
  }, [])

  return {
    ...state,
    execute,
    reset,
    cancel,
    isLoading: state.loading
  }
}

// Hook especializado para operaciones de Supabase
export const useSupabaseOperation = <T>(options: AsyncOperationOptions = {}) => {
  const asyncOp = useAsyncOperation<T>(options)

  const executeSupabase = useCallback(async (
    operation: () => Promise<{ data: T | null; error: any }>,
    showLoading = true
  ) => {
    return asyncOp.execute(async () => {
      const { data, error } = await operation()
      
      if (error) {
        throw new Error(error.message || 'Error en la operación de base de datos')
      }
      
      if (data === null) {
        throw new Error('No se encontraron datos')
      }
      
      return data
    }, showLoading)
  }, [asyncOp])

  return {
    ...asyncOp,
    executeSupabase
  }
}