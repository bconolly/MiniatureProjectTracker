import { useState, useCallback } from 'react'
import { AxiosResponse, AxiosError } from 'axios'
import type { ErrorResponse } from '../types'

export interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface ApiHookReturn<T> extends ApiState<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<AxiosResponse<T>>
): ApiHookReturn<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const response = await apiFunction(...args)
        setState({
          data: response.data,
          loading: false,
          error: null,
        })
        return response.data
      } catch (error) {
        const errorMessage = extractErrorMessage(error as AxiosError<ErrorResponse>)
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        })
        return null
      }
    },
    [apiFunction]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

export function extractErrorMessage(error: AxiosError<ErrorResponse>): string {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message
  }
  
  if (error.response?.status === 404) {
    return 'Resource not found'
  }
  
  if (error.response?.status === 400) {
    return 'Invalid request data'
  }
  
  if (error.response?.status && error.response.status >= 500) {
    return 'Server error occurred'
  }
  
  if (error.code === 'NETWORK_ERROR') {
    return 'Network connection failed'
  }
  
  return error.message || 'An unexpected error occurred'
}