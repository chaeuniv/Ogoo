// 사용자 프로필 목 데이터
// ⚠️ API 연동 시 이 파일을 제거하고 실제 사용자 fetch 결과로 교체하세요.
// 현재 마이 페이지, 분석 페이지 등에서 공통으로 참조합니다.

export const MOCK_USER = {
  nickname: '어쩌구',            // 표시 닉네임
  photo: null as string | null,  // 프로필 이미지 URL (null이면 기본 원형)
  stats: {
    totalRecords: 124,           // 누적 소비 기록 수
    topCategory: '배달음식',      // 최다 기록 카테고리
    topEmotion: '기쁨',          // 최다 감정 키워드
  },
  badgeName: '프로 기록러',      // 현재 대표 뱃지 이름
}
