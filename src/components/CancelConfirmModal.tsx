'use client'

// 기록하기 플로우 X버튼 → 작성 취소 확인 팝업
// 확인 시: reset() 호출 후 /logs(기록화면)으로 이동
// 취소 시: 팝업 닫고 현재 스텝 유지

interface Props {
  onConfirm: () => void   // 확인 버튼 → 부모에서 reset() + router.push('/logs') 처리
  onClose: () => void     // 취소 버튼 → 팝업 닫기
}

export default function CancelConfirmModal({ onConfirm, onClose }: Props) {
  return (
    // 배경 딤 — 탭하면 닫힘
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      {/* 모달 본체 — 탭 이벤트 버블링 차단 */}
      <div
        className="w-72 bg-white rounded-2xl overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 텍스트 영역 */}
        <div className="px-6 pt-7 pb-5 text-center">
          <p className="text-base font-bold text-gray-900">작성을 취소할까요?</p>
          <p className="mt-1.5 text-sm text-gray-400">입력한 내용이 모두 사라져요</p>
        </div>

        {/* 버튼 영역 — 구분선 위 */}
        <div className="flex border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-sm font-medium text-gray-500 border-r border-gray-100 active:bg-gray-50 transition-colors"
          >
            계속 작성
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 text-sm font-semibold text-red-500 active:bg-gray-50 transition-colors"
          >
            취소할게요
          </button>
        </div>
      </div>
    </div>
  )
}
