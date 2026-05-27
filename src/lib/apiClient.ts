import { getAccessToken } from '@/lib/auth'

export type ApiResponse<T> = {
  success: boolean
  data: T
  error?: string
  timestamp: string
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const token = await getAccessToken()
  const isFormData = options?.body instanceof FormData

  const res = await fetch(path, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error((json as ApiResponse<unknown>)?.error ?? `HTTP ${res.status}`)
  }
  return json as ApiResponse<T>
}
