'use client'

// Step 1: 사진 촬영 / 갤러리 선택 / 건너뛰기
// - camera 뷰: 후면 카메라 스트림 + 촬영 버튼 + 갤러리 버튼 + 건너뛰기
// - preview 뷰: 촬영/선택한 사진 확인 후 다음 또는 재촬영

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useRecord } from '../RecordProvider'
import CancelConfirmModal from '@/components/CancelConfirmModal'

// 현재 화면 상태: 카메라 또는 미리보기
type View = 'camera' | 'preview'

export default function Step1Page() {
  const router = useRouter()
  const { set, reset } = useRecord()

  const [view, setView] = useState<View>('camera')
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)
  const [captureSource, setCaptureSource] = useState<'CAMERA' | 'GALLERY'>('CAMERA')
  const [cameraError, setCameraError] = useState(false)        // 카메라 권한 거부 등 에러 여부
  const [galleryThumb, setGalleryThumb] = useState<string | null>(null) // 갤러리 버튼 썸네일

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null) // 현재 카메라 스트림 (해제 시 사용)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 카메라 스트림 정지 (뷰 전환 / 언마운트 시 호출)
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  // 후면 카메라 스트림 시작
  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(true)
      return
    }
    setCameraError(false)
    try {
      stopStream()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // 후면 카메라 우선
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setCameraError(true)
    }
  }, [stopStream])

  // view 변경 시 카메라 시작/정지, 언마운트 시 정리
  useEffect(() => {
    if (view === 'camera') {
      startCamera()
    } else {
      stopStream()
    }
    return stopStream
  }, [view, startCamera, stopStream])

  // 현재 비디오 프레임을 캔버스에 캡처 → base64 JPEG 저장
  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCaptureSource('CAMERA')
    setPreviewPhoto(dataUrl)
    setView('preview')
  }

  // 갤러리에서 이미지 선택 → ObjectURL로 미리보기
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setCaptureSource('GALLERY')
    setGalleryThumb(url)
    setPreviewPhoto(url)
    setView('preview')
    e.target.value = '' // 같은 파일 재선택 가능하게 초기화
  }

  // 사진 없이 다음 스텝으로
  const handleSkip = () => {
    stopStream()
    set({ photo: null })
    router.push('/record/step2')
  }

  const [showCancelModal, setShowCancelModal] = useState(false)

  // X 버튼: 확인 팝업 열기
  const handleCancel = () => setShowCancelModal(true)

  // 팝업 확인: 스트림 정지 + 상태 초기화 후 기록화면으로
  const handleConfirmCancel = () => {
    stopStream()
    reset()
    const editId = sessionStorage.getItem('editRecordId')
    sessionStorage.removeItem('editRecordId')
    router.push(editId ? `/logs/${editId}` : '/logs')
  }

  // 미리보기 확인: 사진 저장 후 step2로
  const handleConfirm = () => {
    set({ photo: previewPhoto, photoSource: captureSource })
    router.push('/record/step2')
  }

  // 미리보기 → 카메라 뷰로 복귀
  const handleBack = () => {
    setPreviewPhoto(null)
    setView('camera')
  }

  // ── 사진 확정 화면 (상태 3) ──
  if (view === 'preview' && previewPhoto) {
    return (
      <div className="relative flex flex-col max-w-md mx-auto bg-black overflow-hidden" style={{ height: '100dvh' }}>
        {showCancelModal && <CancelConfirmModal onConfirm={handleConfirmCancel} onClose={() => setShowCancelModal(false)} />}
        {/* 상단 */}
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pb-4"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
        >
          <button onClick={handleBack} className="p-2" aria-label="뒤로가기">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="w-6 h-6">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <button onClick={handleCancel} className="p-2" aria-label="취소">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="w-6 h-6">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 사진 미리보기 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewPhoto}
          alt="선택한 사진"
          className="flex-1 w-full object-contain"
        />

        {/* 다음 버튼 */}
        <div className="px-4 pb-10 pt-4 bg-black">
          <button
            onClick={handleConfirm}
            className="w-full py-4 rounded-2xl bg-white text-black font-semibold text-base"
          >
            다음
          </button>
        </div>
      </div>
    )
  }

  // ── 카메라 화면 (상태 1) ──
  return (
    <div className="relative flex flex-col max-w-md mx-auto bg-black overflow-hidden" style={{ height: '100dvh' }}>
      {showCancelModal && <CancelConfirmModal onConfirm={handleConfirmCancel} onClose={() => setShowCancelModal(false)} />}
      {/* X 버튼 */}
      <div
        className="absolute top-0 left-0 z-10 px-5"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <button onClick={handleCancel} className="p-2" aria-label="취소">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="w-6 h-6">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 카메라 프리뷰 or 에러 */}
      {cameraError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-14 h-14 opacity-60">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <p className="text-white text-lg font-semibold">카메라 권한이 필요해요</p>
          <p className="text-white/60 text-sm leading-relaxed">
            브라우저 설정에서 카메라 접근을 허용한 후<br />다시 시도해주세요
          </p>
          <button
            onClick={startCamera}
            className="mt-2 px-7 py-3 bg-white text-black rounded-full text-sm font-semibold"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="flex-1 w-full object-cover"
        />
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* 하단 컨트롤 바 */}
      <div className="flex items-center justify-between px-8 py-8">
        {/* 갤러리 썸네일 버튼 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center shrink-0"
          aria-label="갤러리에서 선택"
        >
          {galleryThumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={galleryThumb} alt="마지막 선택 사진" className="w-full h-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-7 h-7">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          )}
        </button>

        {/* 촬영 버튼 */}
        <button
          onClick={capture}
          disabled={cameraError}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
          aria-label="사진 촬영"
        >
          <div className="w-16 h-16 rounded-full bg-white" />
        </button>

        {/* 건너뛰기 */}
        <button
          onClick={handleSkip}
          className="text-white text-sm font-medium w-14 text-right leading-tight"
        >
          건너뛰기 &gt;&gt;
        </button>
      </div>

      {/* 숨겨진 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}
