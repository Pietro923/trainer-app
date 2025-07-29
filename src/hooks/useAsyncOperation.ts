// hooks/useAsyncOperation.ts - Versión simplificada y más robusta
import { useState, useCallback } from 'react'

interface AsyncOperationState<T> {
  loading: boolean
  error: string | null
  data: T | null
  success: boolean
}

export const useAsyncOperation = <T>() => {
  const [state, setState] = useState<AsyncOperationState<T>>({
    loading: false,
    error: null,
    data: null,
    success: false
  })

  const execute = useCallback(async (
    operation: () => Promise<T>,
    showLoading = true
  ): Promise<T | null> => {
    if (showLoading) {
      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null, 
        success: false 
      }))
    }

    try {
      const result = await operation()
      
      setState({
        loading: false,
        error: null,
        data: result,
        success: true
      })
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setState({
        loading: false,
        error: errorMessage,
        data: null,
        success: false
      })
      
      console.error('AsyncOperation Error:', {
        error: err,
        message: errorMessage,
        timestamp: new Date().toISOString()
      })
      
      throw err
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      data: null,
      success: false
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
    isLoading: state.loading
  }
}

// Hook especializado para operaciones de Supabase (SIMPLIFICADO)
export const useSupabaseOperation = <T>() => {
  const asyncOp = useAsyncOperation<T>()

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