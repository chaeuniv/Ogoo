'use client'

// 하단 탭 바 — 홈 / 기록 / 분석 / 마이
// usePathname()으로 현재 경로 감지해 활성 탭 스타일 적용

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// 탭 목록: label(표시명), href(라우트), icon(SVG)
const TABS = [
  {
    label: '홈',
    href: '/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: '기록',
    href: '/logs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    label: '분석',
    href: '/analysis',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: '마이',
    href: '/my',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex border-t border-gray-100 shrink-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
    >
      {TABS.map(({ label, href, icon }) => {
        const active = pathname === href
        return (
          <Link
            key={label}
            href={href}
            className={`flex-1 flex flex-col items-center pt-3 pb-2 gap-1 text-xs transition-colors ${
              active ? 'text-black font-semibold' : 'text-gray-400'
            }`}
          >
            {icon}
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
