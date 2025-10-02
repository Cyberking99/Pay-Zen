"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (apiCall: () => Promise<T>, showToast = true) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const result = await apiCall()
      setState({ data: result, loading: false, error: null })
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))

      if (showToast) {
        toast.error(errorMessage)
      }

      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}
