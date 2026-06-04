'use client'

// 내 카테고리 관리 페이지
// - 카테고리 pill 목록 (× 버튼으로 삭제 확인 → 삭제)
// - 카테고리 추가하기 버튼 → 바텀 시트 입력
// - 뒤로가기 시 변경 사항 있으면 미저장 확인 모달
// - 저장 버튼 (변경 사항 있을 때만 활성화)
// 카테고리는 Supabase user_metadata.categories 에 저장

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const DEFAULT_CATEGORIES = ['카페·편의점', '외식·배달', '주류', '패션잡화', '문화생활', '화장품', '기타']
const MAX_NAME_LEN = 12

// ── 미저장 확인 모달 ────────────────────────────────────────────
function UnsavedModal({ onLeave, onStay }: { onLeave: () => void; onStay: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onStay}>
      <div className="bg-white rounded-2xl mx-6 overflow-hidden w-full max-w-xs" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-8 pb-6 text-center">
          <p className="text-base font-black text-gray-900 leading-snug mb-2">
            카테고리를 저장하지 않고{'\n'}나가시겠어요?
          </p>
          <p className="text-sm text-gray-500">수정된 내용은 저장되지 않습니다.</p>
        </div>
        <div className="flex">
          <button onClick={onLeave} className="flex-1 py-4 text-sm font-semibold text-gray-500 bg-gray-100">나가기</button>
          <button onClick={onStay} className="flex-1 py-4 text-sm font-bold" style={{ background: '#121211', color: '#F5F378' }}>계속 수정하기</button>
        </div>
      </div>
    </div>
  )
}

// ── 삭제 확인 모달 ──────────────────────────────────────────────
function DeleteModal({ target, onConfirm, onCancel }: { target: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onCancel}>
      <div className="bg-white rounded-2xl mx-6 overflow-hidden w-full max-w-xs" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-8 pb-6 text-center">
          <p className="text-base font-black text-gray-900 mb-2">정말 삭제하시겠어요?</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-700">'{target}'</span> 카테고리를 삭제합니다.{'\n'}삭제 후 저장해야 반영됩니다.
          </p>
        </div>
        <div className="flex">
          <button onClick={onCancel} className="flex-1 py-4 text-sm font-semibold text-gray-500 bg-gray-100">취소</button>
          <button onClick={onConfirm} className="flex-1 py-4 text-sm font-bold" style={{ background: '#121211', color: '#F5F378' }}>삭제하기</button>
        </div>
      </div>
    </div>
  )
}

// ── 카테고리 추가 바텀 시트 ─────────────────────────────────────
function AddSheet({ onAdd, onClose, existing }: {
  onAdd: (name: string) => void
  onClose: () => void
  existing: string[]
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')

  const isDuplicate = existing.includes(value.trim())
  const canAdd = value.trim().length > 0 && !isDuplicate

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleAdd = () => {
    if (!canAdd) return
    onAdd(value.trim())
    setValue('')
  }

  return (
    <div className="absolute inset-0 z-40 flex items-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mt-3 mb-5" />

        <div className="px-5 pb-2">
          <p className="text-base font-bold text-gray-900 mb-4">카테고리 추가하기</p>
          <input
            ref={inputRef}
            value={value}
            onChange={e => { if (e.target.value.length <= MAX_NAME_LEN) setValue(e.target.value) }}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            placeholder="추가하고 싶은 카테고리 명을 입력해주세요"
            className="w-full px-4 py-3.5 rounded-xl bg-gray-50 text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
          {isDuplicate && value.trim().length > 0 && (
            <p className="text-xs text-red-400 mt-1.5 text-right">이미 있는 카테고리예요</p>
          )}
          <p className="text-xs text-gray-300 text-right mt-1">{value.length}/{MAX_NAME_LEN}</p>
        </div>

        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className="w-full py-4 text-base font-bold mt-2 transition-opacity disabled:opacity-40"
          style={{ background: '#121211', color: '#F5F378' }}
        >
          추가하기
        </button>
        <div style={{ height: 'max(env(safe-area-inset-bottom, 0px), 0px)' }} />
      </div>
    </div>
  )
}

// ── 페이지 ──────────────────────────────────────────────────────
export default function CategoryManagePage() {
  const router = useRouter()

  const [originalCategories, setOriginalCategories] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showUnsaved, setShowUnsaved] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSession().then(({ data }) => {
      const user = data.session?.user
      // TODO [API] 카테고리 API 연동 시 여기서 fetch
      const saved = user?.user_metadata?.categories as string[] | undefined
      const cats = saved ?? [...DEFAULT_CATEGORIES]
      setOriginalCategories(cats)
      setCategories(cats)
    })
  }, [])

  const isDirty = JSON.stringify(categories) !== JSON.stringify(originalCategories)

  const handleBack = () => {
    if (isDirty) setShowUnsaved(true)
    else router.back()
  }

  const handleSave = async () => {
    setSaving(true)
    // TODO [API] 카테고리 저장 API 연동 시 교체
    await supabase.auth.updateUser({ data: { categories } })
    setSaving(false)
    setOriginalCategories(categories)
    router.back()
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    setCategories(prev => prev.filter(c => c !== deleteTarget))
    setDeleteTarget(null)
  }

  const handleAdd = (name: string) => {
    setCategories(prev => [...prev, name])
    setShowAddSheet(false)
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
        <span className="text-base font-bold text-gray-900">내 카테고리 관리</span>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="text-sm font-semibold px-1 py-2 transition-colors"
          style={{ color: isDirty ? '#111' : '#C0C0C0' }}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </header>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto px-5 pt-6">
        <p className="text-xl font-black text-gray-900 leading-snug mb-6">
          소비 카테고리를 추가하거나{'\n'}삭제할 수 있어요
        </p>

        {/* 카테고리 pill 목록 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <div
              key={cat}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: '#F5F378', color: '#111' }}
            >
              <span>{cat}</span>
              <button
                onClick={() => setDeleteTarget(cat)}
                className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 transition-colors"
                aria-label={`${cat} 삭제`}
              >
                <svg viewBox="0 0 12 12" width={10} height={10} fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="#111" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}

          {/* 카테고리 추가하기 버튼 */}
          <button
            onClick={() => setShowAddSheet(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg viewBox="0 0 16 16" width={14} height={14} fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            카테고리 추가하기
          </button>
        </div>
      </div>

      <BottomNav />

      {/* 카테고리 추가 바텀 시트 */}
      {showAddSheet && (
        <AddSheet
          onAdd={handleAdd}
          onClose={() => setShowAddSheet(false)}
          existing={categories}
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <DeleteModal
          target={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* 미저장 확인 모달 */}
      {showUnsaved && (
        <UnsavedModal
          onLeave={() => { setShowUnsaved(false); router.back() }}
          onStay={() => setShowUnsaved(false)}
        />
      )}
    </div>
  )
}
