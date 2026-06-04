import { getSession } from './auth'

export async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const { data } = await getSession()
  const token = data.session?.access_token
  // FormData일 때는 Content-Type을 지정하지 않음 (브라우저가 boundary 포함해 자동 설정)
  const isFormData = options?.body instanceof FormData
  return fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
