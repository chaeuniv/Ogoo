// 소비 키워드 공유 상수
// Server Component / Client Component 어디서든 import 가능

export type Keyword =
  | '소확행'
  | '스트레스'
  | '합리적 소비'
  | '충동적 소비'
  | '보상심리'
  | '잘 모르겠어요'

export const KEYWORD_COLORS: Record<Keyword, string> = {
  '소확행':        '#E9DEEF',
  '스트레스':      '#FFA4A4',
  '합리적 소비':   '#CBFFC5',
  '충동적 소비':   '#FFD8B6',
  '보상심리':      '#A8E5F6',
  '잘 모르겠어요': '#EEEEEE',
}
