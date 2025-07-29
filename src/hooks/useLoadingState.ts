// hooks/useLoadingState.ts
import { useState, useCallback } from 'react'

export const useLoadingState = (initialState = false) => {
  const [loading, setLoading] = useState(initialState)

  const withLoading = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    setLoading(true)
    try {
      const result = await operation()
      return result
    } finally {
      setLoading(false)
    }
  }, [])

  const startLoading = useCallback(() => setLoading(true), [])
  const stopLoading = useCallback(() => setLoading(false), [])

  return {
    loading,
    withLoading,
    startLoading,
    stopLoading
  }
}