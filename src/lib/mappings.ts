// 프론트엔드 한국어 값 ↔ Prisma enum 변환 유틸

export function toCategoryEnum(korean: string): string {
  const map: Record<string, string> = {
    '카페·편의점': 'FOOD',
    '외식·배달':   'FOOD',
    '화장품':      'SHOPPING',
    '패션잡화':    'SHOPPING',
    '주류':        'FOOD',
    '문화생활':    'ENTERTAINMENT',
    '운동·건강':   'HEALTH',
    '교통':        'TRANSPORT',
  }
  return map[korean] ?? 'OTHER'
}

export function toKeywordEnum(korean: string): string {
  const map: Record<string, string> = {
    '소확행':        'STABLE',
    '합리적 소비':   'STABLE',
    '잘 모르겠어요': 'STABLE',
    '충동적 소비':   'IMPULSE',
    '스트레스':      'STRESS',
    '보상심리':      'REWARD',
  }
  return map[korean] ?? 'STABLE'
}

// API Prisma enum → 한국어 키워드 (화면 표시용)
// keywordLabel이 있으면 우선 사용 (소확행·잘 모르겠어요 구분용)
export function enumToKeyword(prismaEnum: string, keywordLabel?: string | null): string {
  if (keywordLabel) return keywordLabel
  const map: Record<string, string> = {
    STABLE:  '합리적 소비',
    IMPULSE: '충동적 소비',
    STRESS:  '스트레스',
    REWARD:  '보상심리',
  }
  return map[prismaEnum] ?? '잘 모르겠어요'
}

// 카드 표시용 카테고리 (Prisma enum → 한국어 축약)
export function enumToCategoryDisplay(prismaEnum: string): string {
  const map: Record<string, string> = {
    FOOD:          '식비',
    SHOPPING:      '쇼핑',
    ENTERTAINMENT: '문화생활',
    HEALTH:        '건강',
    TRANSPORT:     '교통',
    OTHER:         '기타',
  }
  return map[prismaEnum] ?? '기타'
}

// Prisma enum → 한국어 카테고리 (수정 플로우에서 RecordProvider에 주입 시 사용, 손실 변환)
export function enumToKoreanCategory(prismaEnum: string): string {
  const map: Record<string, string> = {
    FOOD:          '외식·배달',
    SHOPPING:      '패션잡화',
    ENTERTAINMENT: '문화생활',
    HEALTH:        '운동·건강',
    TRANSPORT:     '교통',
    OTHER:         '기타',
  }
  return map[prismaEnum] ?? '기타'
}

// 캘린더 도트 색상 (Prisma enum → hex)
export const ENUM_DOT_COLORS: Record<string, string> = {
  STABLE:  '#7ED87A',
  IMPULSE: '#F7B47A',
  STRESS:  '#F07070',
  REWARD:  '#70CEEB',
}
