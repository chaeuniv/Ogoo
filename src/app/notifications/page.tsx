'use client'

// 알림 목록 페이지
// 상단 벨 아이콘 클릭 시 진입
// TODO [API] 실제 알림 데이터는 GET /api/notifications 로 교체

import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

interface Notification {
  id: string
  title: string
  body: string
  read: boolean
}

// TODO [API] 목 데이터 → GET /api/notifications 응답으로 교체
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: '소비 만족도를 평가해주세요',
    body: '5월 10일 말차프라푸치노',
    read: false,
  },
  {
    id: '2',
    title: '일주일 동안 소비를 기록하지 않았어요',
    body: '소비를 기록하고, 나의 소비 패턴을 확인해보세요',
    read: false,
  },
  {
    id: '3',
    title: '지난주 소비 리포트가 발행됐어요',
    body: '소비 리포트를 확인하고, 나의 소비를 돌아보세요',
    read: true,
  },
  {
    id: '4',
    title: '새로운 뱃지를 확인해보세요',
    body: '프로 기록러 뱃지를 새로 받았어요',
    read: true,
  },
]

export default function NotificationsPage() {
  const router = useRouter()

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
        <span className="text-base font-bold text-gray-900">알림</span>
        <div className="w-9" />
      </header>

      {/* 알림 목록 */}
      <div className="flex-1 overflow-y-auto">
        {MOCK_NOTIFICATIONS.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">알림이 없어요</p>
          </div>
        ) : (
          MOCK_NOTIFICATIONS.map((n, i) => (
            <div key={n.id}>
              <button
                className="w-full text-left px-5 py-4 active:bg-gray-50 transition-colors"
              >
                <p
                  className="text-sm font-bold leading-snug mb-1"
                  style={{ color: n.read ? '#9CA3AF' : '#111' }}
                >
                  {n.title}
                </p>
                <p className="text-xs text-gray-400 leading-snug">{n.body}</p>
              </button>
              {i < MOCK_NOTIFICATIONS.length - 1 && (
                <div className="h-px bg-gray-100 mx-5" />
              )}
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}
