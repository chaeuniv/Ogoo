'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useRecord } from '../RecordProvider'

type View = 'camera' | 'preview'

export default function Step1Page() {
  const router = useRouter()
  const { set, reset } = useRecord()

  const [view, setView] = useState<View>('camera')
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState(false)
  const [galleryThumb, setGalleryThumb] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(true)
      return
    }
    setCameraError(false)
    try {
      // 기존 스트림 정리 후 재시작
      stopStream()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
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

  useEffect(() => {
    if (view === 'camera') {
      startCamera()
    } else {
      stopStream()
    }
    return stopStream
  }, [view, startCamera, stopStream])

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setPreviewPhoto(dataUrl)
    setView('preview')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setGalleryThumb(url)
    setPreviewPhoto(url)
    setView('preview')
    e.target.value = ''
  }

  const handleSkip = () => {
    stopStream()
    set({ photo: null })
    router.push('/record/step2')
  }

  const handleCancel = () => {
    stopStream()
    reset()
    router.push('/')
  }

  const handleConfirm = () => {
    set({ photo: previewPhoto })
    router.push('/record/step2')
  }

  const handleBack = () => {
    setPreviewPhoto(null)
    setView('camera')
  }

  // ── 사진 확정 화면 (상태 3) ──
  if (view === 'preview' && previewPhoto) {
    return (
      <div className="relative flex flex-col max-w-md mx-auto bg-black overflow-hidden" style={{ height: '100dvh' }}>
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
