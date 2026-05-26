// 인증 상태 관리 유틸
// API 연동 시 isLoggedIn → 토큰 검증, login → OAuth 처리, logout → 토큰 삭제로 교체

const AUTH_KEY = 'ogoo_logged_in'

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(AUTH_KEY) === 'true'
}

export function login(): void {
  localStorage.setItem(AUTH_KEY, 'true')
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY)
}
