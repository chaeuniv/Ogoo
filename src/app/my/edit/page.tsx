'use client'

// 프로필 수정 페이지
// - 닉네임 변경 + 유효성 검사 (실시간)
// - 프로필 사진 변경 (카메라 / 갤러리, step1과 동일 패턴)
// - 변경 사항 있을 때만 저장 버튼 활성화
// - 뒤로가기 시 미저장 변경 있으면 확인 모달

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/api'

// ── 닉네임 유효성 조건 ──────────────────────────────────────────
// · 한글 / 영문 대소문자 / 숫자 / 언더스코어(_) 허용
// · 2자 이상 10자 이하
// · 공백·이모지·특수문자 불허
const NICKNAME_MIN = 2
const NICKNAME_MAX = 10
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_]{2,10}$/

type NicknameStatus = 'idle' | 'too_short' | 'invalid' | 'available' | 'taken'

function getNicknameStatus(value: string, original: string): NicknameStatus {
  if (value === original) return 'idle'
  if (value.length < NICKNAME_MIN) return 'too_short'
  if (!NICKNAME_REGEX.test(value)) return 'invalid'
  // TODO [API] 닉네임 중복 체크 API 연동 시 여기서 서버 확인
  return 'available'
}

const STATUS_MSG: Record<NicknameStatus, string> = {
  idle:      '',
  too_short: `${NICKNAME_MIN}자 이상 입력해주세요`,
  invalid:   '한글, 영문, 숫자, _만 사용 가능해요',
  available: '사용가능한 닉네임입니다.',
  taken:     '이미 사용 중인 닉네임입니다.',
}

// ── 미저장 확인 모달 ────────────────────────────────────────────
function UnsavedModal({ onLeave, onStay }: { onLeave: () => void; onStay: () => void }) {
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onStay}
    >
      <div className="bg-white rounded-2xl mx-6 overflow-hidden w-full max-w-xs" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-5 text-center">
          <p className="text-base font-bold text-gray-900 leading-snug">
            프로필을 저장하지 않고{'\n'}나가시겠어요?
          </p>
          <p className="text-sm text-gray-500 mt-2">수정된 내용은 저장되지 않습니다.</p>
        </div>
        <div className="flex">
          <button
            onClick={onLeave}
            className="flex-1 py-4 text-sm font-semibold text-gray-500 bg-gray-100"
          >
            나가기
          </button>
          <button
            onClick={onStay}
            className="flex-1 py-4 text-sm font-bold"
            style={{ background: '#121211', color: '#F5F378' }}
          >
            계속 수정하기
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 사진 변경 액션 시트 ─────────────────────────────────────────
function PhotoActionSheet({ onCamera, onGallery, onClose }: {
  onCamera: () => void
  onGallery: () => void
  onClose: () => void
}) {
  return (
    <div
      className="absolute inset-0 z-40 flex items-end"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div className="w-full bg-white rounded-t-3xl" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mt-3 mb-4" />
        <button
          onClick={onCamera}
          className="w-full flex items-center gap-4 px-6 py-4 active:bg-gray-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span className="text-base font-medium text-gray-900">카메라로 촬영</span>
        </button>
        <div className="h-px bg-gray-100 mx-6" />
        <button
          onClick={onGallery}
          className="w-full flex items-center gap-4 px-6 py-4 active:bg-gray-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <span className="text-base font-medium text-gray-900">갤러리에서 선택</span>
        </button>
        <div className="h-px bg-gray-100 mx-6" />
        <button
          onClick={onClose}
          className="w-full px-6 py-4 text-base font-semibold text-gray-400 active:bg-gray-50"
        >
          취소
        </button>
        <div style={{ height: 'max(env(safe-area-inset-bottom, 0px), 16px)' }} />
      </div>
    </div>
  )
}

// ── 페이지 ──────────────────────────────────────────────────────
export default function ProfileEditPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [originalNickname, setOriginalNickname] = useState('')
  const [nickname, setNickname] = useState('')
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('idle')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)       // 미리보기 URL (로컬)
  const [photoFile, setPhotoFile] = useState<File | null>(null)       // 실제 파일 (업로드용)
  const [showPhotoSheet, setShowPhotoSheet] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSession().then(({ data }) => {
      const user = data.session?.user
      if (!user) return
      const saved = user.user_metadata?.nickname as string | undefined
      const fallback = user.email?.split('@')[0] ?? ''
      const name = saved || fallback
      setOriginalNickname(name)
      setNickname(name)
    })
    // 기존 프로필 사진 로드
    authFetch('/api/user/photo').then(r => r.json()).then(json => {
      if (json.success && json.data.signed_url) setPhotoUrl(json.data.signed_url)
    }).catch(() => {})
  }, [])

  const isDirty = nickname !== originalNickname || photoFile !== null
  const canSave = (nicknameStatus === 'available' || (nickname === originalNickname && photoFile !== null))
    && !saving

  const handleNicknameChange = (value: string) => {
    if (value.length > NICKNAME_MAX) return
    setNickname(value)
    setNicknameStatus(getNicknameStatus(value, originalNickname))
  }

  const handleBack = useCallback(() => {
    if (isDirty) {
      setShowUnsavedModal(true)
    } else {
      router.back()
    }
  }, [isDirty, router])

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      // 사진 변경이 있으면 먼저 업로드
      if (photoFile) {
        const formData = new FormData()
        formData.append('image', photoFile)
        const res = await authFetch('/api/user/photo', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('사진 업로드에 실패했어요')
      }
      // 닉네임 변경
      if (nickname !== originalNickname) {
        const { error } = await supabase.auth.updateUser({ data: { nickname: nickname.trim() } })
        if (error) throw new Error('닉네임 저장에 실패했어요')
      }
      router.back()
    } catch (err) {
      console.error('[handleSave]', err)
    } finally {
      setSaving(false)
    }
  }

  // 카메라 또는 갤러리 file input 트리거
  const openCamera = () => {
    setShowPhotoSheet(false)
    if (!fileInputRef.current) return
    fileInputRef.current.removeAttribute('capture')
    fileInputRef.current.setAttribute('capture', 'environment')
    fileInputRef.current.click()
  }

  const openGallery = () => {
    setShowPhotoSheet(false)
    if (!fileInputRef.current) return
    fileInputRef.current.removeAttribute('capture')
    fileInputRef.current.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoUrl(URL.createObjectURL(file))
    e.target.value = ''
  }

  return (
    <div className="relative flex flex-col max-w-md mx-auto bg-white" style={{ height: '100dvh' }}>

      {/* 헤더 */}
      <header
        className="flex items-center justify-between px-4 pb-3 border-b border-gray-100 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <button onClick={handleBack} className="p-2 -ml-2" aria-label="뒤로가기">
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>

        <span className="text-base font-bold text-gray-900">프로필 수정</span>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="text-sm font-semibold px-1 py-2 transition-colors"
          style={{ color: canSave ? '#111' : '#C0C0C0' }}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </header>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto">

        {/* 프로필 사진 */}
        <div className="flex flex-col items-center pt-8 pb-8">
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden shrink-0">
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="프로필" className="w-full h-full object-cover" />
            )}
          </div>
          <button
            onClick={() => setShowPhotoSheet(true)}
            className="mt-3 text-sm font-medium"
            style={{ color: '#3B82F6' }}
          >
            프로필 사진 변경
          </button>
        </div>

        {/* 닉네임 */}
        <div className="px-5">
          <p className="text-sm font-semibold text-gray-900 mb-2">닉네임</p>
          <input
            value={nickname}
            onChange={e => handleNicknameChange(e.target.value)}
            maxLength={NICKNAME_MAX}
            placeholder={originalNickname}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 text-sm text-gray-900 outline-none focus:bg-gray-100 transition-colors"
          />
          {/* 유효성 메시지 — 우측 하단 정렬 */}
          {nicknameStatus !== 'idle' && (
            <p
              className="text-xs mt-1.5 text-right"
              style={{
                color: nicknameStatus === 'available' ? '#22C55E' : '#EF4444',
              }}
            >
              {STATUS_MSG[nicknameStatus]}
            </p>
          )}
          {/* 글자수 카운터 */}
          <p className="text-xs text-gray-300 text-right mt-1">
            {nickname.length}/{NICKNAME_MAX}
          </p>
        </div>

        {/* 닉네임 조건 안내 */}
        <div className="px-5 mt-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            · 한글, 영문, 숫자, _만 사용 가능해요{'\n'}
            · {NICKNAME_MIN}자 이상 {NICKNAME_MAX}자 이하로 입력해주세요
          </p>
        </div>

      </div>

      <BottomNav />

      {/* 숨긴 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 사진 변경 액션 시트 */}
      {showPhotoSheet && (
        <PhotoActionSheet
          onCamera={openCamera}
          onGallery={openGallery}
          onClose={() => setShowPhotoSheet(false)}
        />
      )}

      {/* 미저장 확인 모달 */}
      {showUnsavedModal && (
        <UnsavedModal
          onLeave={() => { setShowUnsavedModal(false); router.back() }}
          onStay={() => setShowUnsavedModal(false)}
        />
      )}

    </div>
  )
}
