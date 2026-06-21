# 오구 (OGOO) — 감정 소비 기록 앱

> **"내가 왜 샀는지, 느낌까지 기록해요"**

---

## 🇰🇷 한국어

### 서비스 소개

**오구(OGOO)** 는 소비의 금액뿐 아니라 **소비 당시의 감정**을 함께 기록하는 모바일 가계부 서비스입니다.  
AI 영수증 OCR로 번거로운 입력을 줄이고, 감정 키워드·온도 시스템으로 충동 구매·스트레스 소비 등을 시각화해 나만의 소비 패턴을 분석할 수 있습니다.

---

### 사회 문제 및 해결 방안

#### 문제
현대인의 소비는 단순한 필요를 넘어 **감정**에 의해 크게 좌우됩니다.  
스트레스를 받으면 충동 구매를 하고, 보상 심리로 불필요한 지출을 반복하지만 기존 가계부 앱은 금액·카테고리만 기록할 뿐, 그 소비가 나에게 진짜 만족을 줬는지는 알려주지 않습니다.  
결과적으로 사용자는 자신의 **감정 소비 패턴**을 인식하지 못하고 같은 후회를 반복합니다.

#### 해결
오구는 소비마다 **감정 키워드**(소확행·합리적·스트레스·충동·보상심리·잘 모르겠어요)와 **감정 온도(0~100)** 를 함께 기록하게 합니다.  
시간이 지난 소비에는 **별점 리뷰**를 남겨 "그때 그 소비가 진짜 도움이 됐는지" 돌아볼 수 있도록 하고, 분석 대시보드에서는 어떤 감정 유형에 얼마나 쓰는지를 한눈에 보여줍니다.

---

### 주요 기능

#### 🧺 홈 — 오늘의 소비 바구니
- 오늘 기록된 소비 항목이 **감정 색상 아이콘**으로 바구니에 쌓이는 시각화
- 감정 온도에 따라 아이콘 표정이 5단계로 변화
- 최근 소비 카드 가로 스크롤로 빠른 확인

#### 📸 소비 기록 (6단계 위자드)
| 단계 | 내용 |
|------|------|
| 1단계 | 영수증 사진 촬영 또는 갤러리 선택 |
| 2단계 | 카테고리·금액·메모·날짜 입력 (AI OCR 자동 채우기 지원) |
| 3단계 | 감정 키워드 선택 (6종) |
| 4단계 | 감정 온도 슬라이더 (0~100) |
| 5단계 | 최종 확인 및 저장 |
| 6단계 | 과거 소비 리뷰 (별점 + 사유 선택) |

#### 📊 분석 대시보드
- 기간별(1주·1개월·6개월·1년) 감정 키워드 소비 바 차트
- 기간 탐색으로 과거 패턴 비교
- AI 캐릭터가 소비 패턴에 맞는 코멘트 제공
- 상위 키워드 및 상세 리포트 뷰

#### 📅 소비 내역 캘린더
- 날짜별 소비 현황을 캘린더로 한눈에 파악
- 날짜 클릭 시 해당 일의 소비 목록 모달

#### 👤 마이 페이지
- 총 소비 건수·대표 카테고리·대표 감정 통계
- 커스텀 카테고리 설정 (최대 8개)
- 프로필 사진, 닉네임 관리

#### 🔔 알림
- 주간 소비 리포트 알림
- 감정 리뷰 요청 알림

---

### 앱 이용 방법

1. **회원가입 / 로그인** — 이메일·비밀번호로 계정 생성
2. **홈 화면** — 오늘의 소비 바구니 확인 및 + 버튼으로 기록 시작
3. **소비 기록** — 영수증 촬영 → AI가 자동으로 금액·상호명 추출 → 감정 키워드·온도 입력 → 저장
4. **소비 내역** — 하단 탭 "기록" → 캘린더에서 날짜 선택 → 상세 내역 확인·수정·삭제
5. **분석** — 하단 탭 "분석" → 기간 선택 → 감정별 소비 차트 및 AI 코멘트 확인
6. **리뷰** — 며칠 지난 소비 항목에 별점과 리뷰 이유를 남겨 소비를 되돌아보기

---

### 빌드 및 실행 방법

#### 사전 요구사항
- **Node.js** 18 이상
- **PostgreSQL** (또는 Supabase 프로젝트)
- **Supabase** 프로젝트 (Auth + Storage)
- **Anthropic API Key** (Claude 영수증 OCR 사용)

#### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 아래 값을 채워주세요:

```env
# Supabase PostgreSQL (Prisma)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase 클라이언트
NEXT_PUBLIC_SUPABASE_URL="https://<your-project>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<anon key>"
SUPABASE_SERVICE_ROLE_KEY="<service role key>"

# Anthropic (Claude OCR)
ANTHROPIC_API_KEY="sk-ant-..."

# 개발용 인증 스킵 (선택)
NEXT_PUBLIC_DEV_SKIP_AUTH=true
DEV_SKIP_AUTH=true
DEV_USER_ID="<your-uuid>"
```

#### 설치 및 실행

```bash
# 1. 의존성 설치 (postinstall에서 prisma generate 자동 실행)
npm install

# 2. 데이터베이스 마이그레이션
npm run db:migrate

# 3. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속하세요.

#### 프로덕션 빌드

```bash
# 빌드 (prisma generate + next build)
npm run build

# 서버 시작
npm start
```

#### 기타 DB 명령어

```bash
npm run db:studio    # Prisma Studio (DB GUI)
npm run db:push      # 스키마 변경사항을 DB에 직접 반영 (마이그레이션 없이)
npm run db:pull      # DB 스키마를 prisma/schema.prisma에 동기화
```

---

### 기술 스택

| 분류 | 기술 |
|------|------|
| **프레임워크** | Next.js 16.2.6 (App Router) |
| **언어** | TypeScript 5 |
| **UI 라이브러리** | React 19.2 |
| **스타일링** | Tailwind CSS v4 + PostCSS |
| **데이터베이스** | PostgreSQL (Supabase) |
| **ORM** | Prisma 6.19.3 |
| **인증** | Supabase Auth |
| **파일 스토리지** | Supabase Storage |
| **AI / OCR** | Anthropic Claude (claude-sonnet-4-6) |
| **린터** | ESLint 9 |

---

### 팀 / 기여자

| 이름 | GitHub |
|------|--------|
| Hwijung Cho | [@hvvup](https://github.com/hvvup) |
| chaeuniv | [@chaeuniv](https://github.com/chaeuniv) |
| woodying | [@woodying](https://github.com/woodying) |

---

---

## 🇺🇸 English

# OGOO — Emotional Spending Tracker

> **"Record not just what you bought — but how you felt."**

### About

**OGOO** is a mobile-first spending journal that captures the **emotional context** of every purchase alongside the amount.  
AI-powered receipt OCR reduces manual entry, while an emotion keyword and temperature system helps users visualize impulsive, stress-driven, or reward-motivated spending to understand their own consumption patterns.

---

### Social Problem & Solution

#### Problem
Modern consumer spending is heavily driven by **emotion**.  
People make impulse purchases under stress, splurge as self-reward, or spend for emotional relief — but traditional budgeting apps only log amounts and categories.  
Without emotional context, users cannot recognize their own **emotional spending patterns**, causing the same regrettable purchases to repeat.

#### Solution
OGOO asks users to attach an **emotion keyword** (Small joy · Rational · Stress · Impulse · Reward · Unsure) and an **emotion temperature (0–100)** to every purchase.  
After some time has passed, users can leave a **star rating and review** to reflect on whether a purchase was truly worthwhile.  
The analytics dashboard shows how much money flows into each emotional category over time, making unconscious patterns visible.

---

### Features

#### 🧺 Home — Today's Basket
- A visual basket fills with **emotion-colored icons** as you log today's purchases
- Icon expressions change across 5 states based on emotion temperature
- Horizontal scroll of recent spending cards for quick review

#### 📸 Record Consumption (6-Step Wizard)
| Step | Description |
|------|-------------|
| 1 | Capture a receipt photo or pick from gallery |
| 2 | Category, amount, memo, date (AI OCR auto-fills) |
| 3 | Select an emotion keyword (6 types) |
| 4 | Set emotion temperature via slider (0–100) |
| 5 | Review and confirm |
| 6 | Rate past records (stars + reason) |

#### 📊 Analysis Dashboard
- Bar chart of spending by emotion keyword across 1W / 1M / 6M / 1Y periods
- Navigate back through past periods to compare trends
- AI character provides personalized spending commentary
- Top keyword highlights and detailed report view

#### 📅 Consumption Log & Calendar
- Calendar view showing spending activity per day
- Tap a date to see a modal with that day's records

#### 👤 My Page
- Stats: total records, top category, top emotion keyword
- Custom category management (up to 8)
- Profile photo and nickname management

#### 🔔 Notifications
- Weekly spending report alerts
- Pending review reminders for past purchases

---

### How to Use

1. **Sign up / Log in** — Create an account with email and password
2. **Home screen** — View today's basket; tap **+** to start recording
3. **Record a purchase** — Photograph your receipt → AI extracts amount & merchant → add emotion keyword & temperature → save
4. **View logs** — Bottom tab "Logs" → select a date on the calendar → view, edit, or delete records
5. **Analyze** — Bottom tab "Analysis" → choose a time period → view emotion-based spending chart and AI comment
6. **Review** — After a few days, leave a star rating and review reason to reflect on whether the purchase was worthwhile

---

### Build & Run

#### Prerequisites
- **Node.js** 18+
- **PostgreSQL** database (or a Supabase project)
- **Supabase** project (Auth + Storage)
- **Anthropic API Key** (for Claude receipt OCR)

#### Environment Variables

Create a `.env` file in the project root:

```env
# Supabase PostgreSQL (Prisma)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase client
NEXT_PUBLIC_SUPABASE_URL="https://<your-project>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<anon key>"
SUPABASE_SERVICE_ROLE_KEY="<service role key>"

# Anthropic Claude (OCR)
ANTHROPIC_API_KEY="sk-ant-..."

# Dev mode — skip auth (optional)
NEXT_PUBLIC_DEV_SKIP_AUTH=true
DEV_SKIP_AUTH=true
DEV_USER_ID="<your-uuid>"
```

#### Install & Run

```bash
# 1. Install dependencies (prisma generate runs automatically via postinstall)
npm install

# 2. Apply database migrations
npm run db:migrate

# 3. Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

#### Production Build

```bash
# Build (prisma generate + next build)
npm run build

# Start production server
npm start
```

#### Other DB Commands

```bash
npm run db:studio    # Open Prisma Studio (visual DB editor)
npm run db:push      # Push schema changes directly to DB (no migration)
npm run db:pull      # Sync DB schema into prisma/schema.prisma
```

---

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16.2.6 (App Router) |
| **Language** | TypeScript 5 |
| **UI Library** | React 19.2 |
| **Styling** | Tailwind CSS v4 + PostCSS |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma 6.19.3 |
| **Authentication** | Supabase Auth |
| **File Storage** | Supabase Storage |
| **AI / OCR** | Anthropic Claude (claude-sonnet-4-6) |
| **Linter** | ESLint 9 |

---

### Team / Contributors

| Name | GitHub |
|------|--------|
| Hwijung Cho | [@hvvup](https://github.com/hvvup) |
| chaeuniv | [@chaeuniv](https://github.com/chaeuniv) |
| woodying | [@woodying](https://github.com/woodying) |
