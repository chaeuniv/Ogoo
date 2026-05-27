// Mappings between frontend Korean labels and backend English enums

export const KEYWORD_TO_API: Record<string, string> = {
  '소확행':        'STABLE',
  '합리적 소비':   'STABLE',
  '스트레스':      'STRESS',
  '충동적 소비':   'IMPULSE',
  '보상심리':      'REWARD',
  '잘 모르겠어요': 'STABLE',
}

export const API_TO_KEYWORD: Record<string, string> = {
  STABLE:  '소확행',
  STRESS:  '스트레스',
  IMPULSE: '충동적 소비',
  REWARD:  '보상심리',
}

export const CATEGORY_TO_API: Record<string, string> = {
  '카페·편의점': 'FOOD',
  '외식·배달':   'FOOD',
  '패션잡화':    'SHOPPING',
  '화장품':      'SHOPPING',
  '주류':        'OTHER',
  '문화생활':    'ENTERTAINMENT',
  '기타':        'OTHER',
  '운동·건강':   'HEALTH',
}

export const API_TO_CATEGORY: Record<string, string> = {
  FOOD:          '외식·배달',
  TRANSPORT:     '대중교통',
  SHOPPING:      '패션잡화',
  ENTERTAINMENT: '문화생활',
  HEALTH:        '운동·건강',
  OTHER:         '기타',
}
