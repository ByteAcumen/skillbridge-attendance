'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'
import { ApiError, apiFetch } from '@/lib/api'

type QueryState<T> = {
  data: T | null
  error: string | null
  isLoading: boolean
}

export function useApiClient() {
  const { getToken } = useAuth()

  return useCallback(
    async function request<T>(path: string, init: RequestInit = {}) {
      const token = await getToken()
      return apiFetch<T>(path, { ...init, token })
    },
    [getToken],
  )
}

export function useApiQuery<T>(path: string | null) {
  const request = useApiClient()
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    error: null,
    isLoading: Boolean(path),
  })

  const reload = useCallback(async () => {
    if (!path) {
      setState({ data: null, error: null, isLoading: false })
      return null
    }

    setState((current) => ({ ...current, error: null, isLoading: true }))

    try {
      const data = await request<T>(path)
      setState({ data, error: null, isLoading: false })
      return data
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Request failed.'
      setState({ data: null, error: message, isLoading: false })
      return null
    }
  }, [path, request])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [reload])

  return { ...state, reload }
}
