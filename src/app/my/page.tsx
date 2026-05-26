'use client'

// 마이 페이지
// 프로필 / 통계 카드 / 뱃지 배너 / 설정·문의 메뉴 그룹
// 로그아웃 탭 시 확인 모달 표시 (실제 로그인 화면 이동은 미구현)

import { useState } from 'react'
import BottomNav from '@/components/BottomNav'
import { MOCK_USER } from '@/lib/mockUser'

// 공유 목 데이터에서 프로필 참조 (src/lib/mockUser.ts)
const MOCK_PROFILE = MOCK_USER

// ── 공통 아이콘 ──────────────────────────────────────────────

// 오른쪽 꺽쇠 (메뉴 항목 우측 화살표)
function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────

// 섹션 카드: 메뉴 그룹을 담는 둥근 회색 컨테이너
function MenuCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-5 rounded-2xl bg-gray-50 overflow-hidden">
      {children}
    </div>
  )
}

// 섹션 타이틀 (설정 / 문의)
function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-5 pt-5 pb-2 text-xs font-semibold text-gray-400 tracking-wide">{label}</p>
  )
}

// 개별 메뉴 항목
function MenuItem({
  label,
  color = 'text-gray-800',
  onClick,
}: {
  label: string
  color?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium hover:bg-gray-100 transition-colors"
    >
      <span className={color}>{label}</span>
      <ChevronRight />
    </button>
  )
}

// 항목 사이 구분선
function Divider() {
  return <div className="h-px bg-gray-100 mx-5" />
}

// ── 로그아웃 확인 모달 ────────────────────────────────────────

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl mx-6 overflow-hidden w-full max-w-xs"
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫힘 방지
      >
        <div className="px-6 pt-6 pb-5 text-center">
          <p className="text-base font-bold text-gray-900">로그아웃 하시겠어요?</p>
        </div>
        <div className="flex border-t border-gray-100">
          <button
            onClick={onCancel}
            className="flex-1 py-4 text-gray-500 text-sm font-medium border-r border-gray-100"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 text-red-500 text-sm font-bold"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 페이지 ────────────────────────────────────────────────────

export default function MyPage() {
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // 로그아웃 확인 → 로그인 화면으로 이동 (현재 미구현)
  const handleLogoutConfirm = () => {
    setShowLogoutModal(false)
    // TODO: 로그인 화면으로 이동
  }

  const { nickname, photo, stats, badgeName } = MOCK_PROFILE

  return (
    <div className="relative flex flex-col max-w-md mx-auto bg-white" style={{ height: '100dvh' }}>
      {/* 헤더 */}
      <header
        className="flex items-center justify-between px-5 pb-4 border-b border-gray-100 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <span className="text-xl font-bold tracking-tight text-zinc-950">OGOO</span>
        <button aria-label="알림" className="p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </header>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto">

        {/* ── 프로필 영역 ── */}
        <div className="flex flex-col items-center pt-8 pb-6">
          {/* 프로필 이미지: 설정 시 이미지, 미설정 시 회색 원 */}
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden shrink-0">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="프로필 사진" className="w-full h-full object-cover" />
            )}
          </div>

          {/* 닉네임 + 편집 아이콘 */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-lg font-bold text-gray-900">{nickname}</span>
            <button aria-label="닉네임 편집" className="p-0.5">
              {/* 연필 아이콘 */}
              <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── 통계 카드 ── */}
        <div className="mx-5 rounded-2xl bg-gray-50 px-4 py-5 mb-3">
          <div className="flex">
            {/* 내 기록 */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400 font-medium">내 기록</span>
              <span className="text-base font-bold text-gray-900">
                {/* 기록이 없으면 0개 표시 */}
                {stats.totalRecords}개
              </span>
            </div>
            <div className="w-px bg-gray-200" />
            {/* 최다 품목 */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400 font-medium">최다 품목</span>
              <span className="text-base font-bold text-gray-900">
                {/* 기록 없으면 "-" */}
                {stats.totalRecords > 0 ? stats.topCategory : '-'}
              </span>
            </div>
            <div className="w-px bg-gray-200" />
            {/* 최다 감정 */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400 font-medium">최다 감정</span>
              <span className="text-base font-bold text-gray-900">
                {/* 기록 없으면 "-" */}
                {stats.totalRecords > 0 ? stats.topEmotion : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* ── 뱃지 배너 ── */}
        {/* 탭 → 뱃지 목록 화면으로 이동 (별도 화면 스펙 필요, 현재 미구현) */}
        <button
          className="mx-5 w-[calc(100%-40px)] rounded-2xl px-5 py-5 mb-6 flex items-center justify-between active:scale-95 transition-transform"
          style={{ background: '#121211' }}
        >
          {/* 좌측 텍스트 */}
          <div className="flex flex-col gap-1 text-left">
            <span className="text-sm font-bold" style={{ color: '#F5F378' }}>내 뱃지 보러가기!</span>
            <span className="text-sm text-white/70">{badgeName}</span>
          </div>

          {/* 우측 육각형 뱃지 플레이스홀더 (뱃지 디자인 미정) */}
          <div
            className="w-14 h-14 flex items-center justify-center shrink-0"
            style={{
              clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
              background: 'rgba(245,243,120,0.15)',
            }}
          >
            {/* 뱃지 이미지 영역 — 추후 <img> 교체 */}
            <div className="w-8 h-8 rounded-full bg-white/20" />
          </div>
        </button>

        {/* ── 설정 메뉴 그룹 ── */}
        <SectionLabel label="설정" />
        <MenuCard>
          <MenuItem label="내 카테고리 관리" />
          <Divider />
          <MenuItem label="알림 설정" />
          <Divider />
          <MenuItem label="개인 정보" />
          <Divider />
          <MenuItem label="회원 탈퇴" />
          <Divider />
          {/* 로그아웃은 강조색(빨강) + 확인 모달 */}
          <MenuItem label="로그아웃" color="text-red-500" onClick={() => setShowLogoutModal(true)} />
        </MenuCard>

        {/* ── 문의 메뉴 그룹 ── */}
        <SectionLabel label="문의" />
        <MenuCard>
          <MenuItem label="문의" />
        </MenuCard>

        {/* 하단 여백 */}
        <div className="h-6" />
      </div>

      <BottomNav />

      {/* 로그아웃 확인 모달 */}
      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  )
}
