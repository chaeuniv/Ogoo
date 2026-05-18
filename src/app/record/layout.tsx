// /record/** 하위 페이지 공통 레이아웃
// RecordProvider로 감싸서 step 간 상태 공유

import { RecordProvider } from './RecordProvider'

export default function RecordLayout({ children }: { children: React.ReactNode }) {
  return (
    <RecordProvider>
      <div className="max-w-md mx-auto">
        {children}
      </div>
    </RecordProvider>
  )
}
