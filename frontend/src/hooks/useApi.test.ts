import { renderHook, act } from '@testing-library/react'
import { AxiosResponse, AxiosError } from 'axios'
import { useApi, extractErrorMessage } from './useApi'
import { describe, it, expect, vi } from 'vitest'
import type { ErrorResponse } from '../types'

describe('useApi', () => {
  it('should handle successful API calls', async () => {
    const mockApiFunction = vi.fn().mockResolvedValue({
      data: { id: 1, name: 'Test Project' },
    } as AxiosResponse)

    const { result } = renderHook(() => useApi(mockApiFunction))

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)

    await act(async () => {
      const data = await result.current.execute('arg1', 'arg2')
      expect(data).toEqual({ id: 1, name: 'Test Project' })
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toEqual({ id: 1, name: 'Test Project' })
    expect(result.current.error).toBe(null)
    expect(mockApiFunction).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should handle API errors', async () => {
    const mockError = {
      response: {
        data: {
          error: {
            message: 'Test error message',
          },
        },
      },
    } as AxiosError

    const mockApiFunction = vi.fn().mockRejectedValue(mockError)

    const { result } = renderHook(() => useApi(mockApiFunction))

    await act(async () => {
      const data = await result.current.execute()
      expect(data).toBe(null)
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe('Test error message')
  })

  it('should reset state', async () => {
    const mockApiFunction = vi.fn().mockResolvedValue({
      data: { id: 1, name: 'Test Project' },
    } as AxiosResponse)

    const { result } = renderHook(() => useApi(mockApiFunction))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).not.toBe(null)

    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)
    expect(result.current.loading).toBe(false)
  })
})

describe('extractErrorMessage', () => {
  it('should extract error message from response', () => {
    const error = {
      response: {
        data: {
          error: {
            error_type: 'validation_error',
            message: 'Custom error message',
            timestamp: '2024-01-01T00:00:00Z'
          },
        },
      },
    } as AxiosError<ErrorResponse>

    expect(extractErrorMessage(error)).toBe('Custom error message')
  })

  it('should handle 404 errors', () => {
    const error = {
      response: {
        status: 404,
      },
    } as AxiosError<ErrorResponse>

    expect(extractErrorMessage(error)).toBe('Resource not found')
  })

  it('should handle network errors', () => {
    const error = {
      code: 'NETWORK_ERROR',
      message: 'Network Error',
    } as AxiosError<ErrorResponse>

    expect(extractErrorMessage(error)).toBe('Network connection failed')
  })
})