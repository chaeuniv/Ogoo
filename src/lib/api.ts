import { getSession } from './auth'

export async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const { data } = await getSession()
  const token = data.session?.access_token
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
