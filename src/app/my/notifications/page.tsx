'use client'

// 알림 설정 페이지
// 마이페이지 > 설정 > 알림 설정 진입
// TODO [API] 설정값 저장/불러오기는 GET|PATCH /api/notifications/settings 로 교체

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

const STORAGE_KEY = 'notification-settings'

interface NotifSetting {
  id: string
  title: string
  description: string
  enabled: boolean
}

// ── 토글 컴포넌트 ────────────────────────────────────────────
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="relative shrink-0 transition-colors duration-200"
      style={{
        width: 51,
        height: 31,
        borderRadius: 999,
        background: enabled ? '#F5F378' : '#E5E7EB',
      }}
    >
      <span
        className="absolute top-0.5 transition-transform duration-200"
        style={{
          left: 0,
          width: 27,
          height: 27,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          transform: enabled ? 'translateX(22px)' : 'translateX(2px)',
        }}
      />
    </button>
  )
}

// ── 페이지 ──────────────────────────────────────────────────
export default function NotificationSettingsPage() {
  const router = useRouter()

  const DEFAULT_SETTINGS: NotifSetting[] = [
    {
      id: 'record_reminder',
      title: '기록 독려 알림',
      description: '일주일간 소비를 기록하지 않았을 때 알려드려요',
      enabled: true,
    },
    {
      id: 'report',
      title: '리포트 알림',
      description: '소비리포트가 발행되었을 때 알려드려요',
      enabled: true,
    },
    {
      id: 'review',
      title: '소비 만족도 알림',
      description: '기록한 소비를 돌아볼 때가 되면 알려드려요',
      enabled: true,
    },
    {
      id: 'badge',
      title: '뱃지 알림',
      description: '새로운 뱃지를 받으면 알려드려요',
      enabled: false,
    },
  ]

  // TODO [API] lazy initializer 내부를 GET /api/notifications/settings 응답으로 교체
  // lazy initializer: 첫 렌더 전에 localStorage를 읽어 초기값으로 사용 → 버퍼링 없음
  const [settings, setSettings] = useState<NotifSetting[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return DEFAULT_SETTINGS
      const savedMap: Record<string, boolean> = JSON.parse(saved)
      return DEFAULT_SETTINGS.map(s => ({
        ...s,
        enabled: savedMap[s.id] !== undefined ? savedMap[s.id] : s.enabled,
      }))
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  const handleToggle = (id: string, value: boolean) => {
    setSettings(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, enabled: value } : s)
      // localStorage에 { id: enabled } 형태로 저장
      // TODO [API] localStorage 대신 PATCH /api/notifications/settings 호출로 교체
      const map = Object.fromEntries(updated.map(s => [s.id, s.enabled]))
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)) } catch {}
      return updated
    })
  }

  return (
    <div className="flex flex-col max-w-md mx-auto bg-white" style={{ height: '100dvh' }}>

      {/* 헤더 */}
      <header
        className="flex items-center justify-between px-4 pb-3 border-b border-gray-100 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <button onClick={() => router.back()} className="p-2 -ml-2" aria-label="뒤로가기">
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <span className="text-base font-bold text-gray-900">알림 설정</span>
        <div className="w-9" />
      </header>

      {/* 설정 목록 */}
      <div className="flex-1 overflow-y-auto px-5 pt-2">
        {settings.map((s, i) => (
          <div key={s.id}>
            <div className="flex items-center justify-between py-5 gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 mb-1">{s.title}</p>
                <p className="text-xs text-gray-400 leading-snug">{s.description}</p>
              </div>
              <Toggle enabled={s.enabled} onChange={v => handleToggle(s.id, v)} />
            </div>
            {i < settings.length - 1 && <div className="h-px bg-gray-100" />}
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
