import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

// 테스트 계정 user id (create-test-user.ts 실행 결과)
const USER_ID = '1ebebb9d-e3b8-4f35-9a6a-bd9cdbcce8a8'

function d(dateStr: string, hour = 12): Date {
  return new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00Z`)
}

async function main() {
  const records = [
    // ── 저번 주 (2026-05-24 ~ 2026-05-30) ──────────────────────
    { title: '스타벅스 아메리카노', amount: 5500,  category: 'FOOD',          keyword: 'STABLE',  emotion: 78, consumedAt: d('2026-05-24', 9),  memo: '출근길 커피' },
    { title: '편의점 간식',         amount: 3200,  category: 'FOOD',          keyword: 'STABLE',  emotion: 65, consumedAt: d('2026-05-24', 15), memo: '' },
    { title: '배달 치킨',           amount: 22000, category: 'FOOD',          keyword: 'IMPULSE', emotion: 30, consumedAt: d('2026-05-25', 20), memo: '야식이 먹고 싶었어' },
    { title: '나이키 운동화',        amount: 89000, category: 'SHOPPING',      keyword: 'IMPULSE', emotion: 18, consumedAt: d('2026-05-25', 14), memo: '충동구매했다...' },
    { title: '지하철 교통카드',      amount: 1400,  category: 'TRANSPORT',     keyword: 'STABLE',  emotion: 72, consumedAt: d('2026-05-26', 8),  memo: '' },
    { title: '점심 백반',            amount: 9000,  category: 'FOOD',          keyword: 'STABLE',  emotion: 70, consumedAt: d('2026-05-26', 12), memo: '' },
    { title: '영화 관람',            amount: 14000, category: 'ENTERTAINMENT', keyword: 'REWARD',  emotion: 82, consumedAt: d('2026-05-27', 19), memo: '열심히 일한 나에게 주는 선물' },
    { title: '팝콘 + 음료',         amount: 8500,  category: 'FOOD',          keyword: 'REWARD',  emotion: 75, consumedAt: d('2026-05-27', 19), memo: '' },
    { title: '스트레스 쇼핑',        amount: 45000, category: 'SHOPPING',      keyword: 'STRESS',  emotion: 22, consumedAt: d('2026-05-28', 21), memo: '야근 후 기분 전환하려고' },
    { title: '헬스장 월 이용권',     amount: 65000, category: 'HEALTH',        keyword: 'STABLE',  emotion: 80, consumedAt: d('2026-05-28', 10), memo: '건강을 위한 투자' },
    { title: '카페 라떼',            amount: 6000,  category: 'FOOD',          keyword: 'STABLE',  emotion: 68, consumedAt: d('2026-05-29', 10), memo: '' },
    { title: '배달 피자',            amount: 28000, category: 'FOOD',          keyword: 'IMPULSE', emotion: 25, consumedAt: d('2026-05-29', 19), memo: '또 시켜버렸네' },
    { title: '택시비',               amount: 12000, category: 'TRANSPORT',     keyword: 'STRESS',  emotion: 35, consumedAt: d('2026-05-30', 23), memo: '늦게 끝나서 어쩔 수 없었어' },
    { title: '서점 책 2권',          amount: 32000, category: 'ENTERTAINMENT', keyword: 'STABLE',  emotion: 88, consumedAt: d('2026-05-30', 16), memo: '읽고 싶었던 책 드디어 구매' },

    // ── 이번 주 (2026-05-31 ~ 2026-06-03) ──────────────────────
    { title: '아메리카노',           amount: 4500,  category: 'FOOD',          keyword: 'STABLE',  emotion: 74, consumedAt: d('2026-06-01', 9),  memo: '' },
    { title: '편의점 도시락',        amount: 5800,  category: 'FOOD',          keyword: 'STABLE',  emotion: 60, consumedAt: d('2026-06-01', 13), memo: '' },
    { title: '인터넷 쇼핑 (옷)',     amount: 54000, category: 'SHOPPING',      keyword: 'REWARD',  emotion: 70, consumedAt: d('2026-06-02', 22), memo: '기분 전환' },
    { title: '점심 파스타',          amount: 13000, category: 'FOOD',          keyword: 'STABLE',  emotion: 76, consumedAt: d('2026-06-03', 12), memo: '친구랑 맛있게 먹었다' },
  ]

  console.log(`${records.length}개 소비 기록 삽입 중...`)

  await prisma.consumption.createMany({
    data: records.map(r => ({
      userId:     USER_ID,
      title:      r.title,
      amount:     r.amount,
      category:   r.category as never,
      keyword:    r.keyword as never,
      emotion:    r.emotion,
      consumedAt: r.consumedAt,
      memo:       r.memo || null,
    })),
  })

  console.log('완료!')
  console.log('저번 주 (05-24~05-30): 14건')
  console.log('이번 주 (05-31~06-03): 4건')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
