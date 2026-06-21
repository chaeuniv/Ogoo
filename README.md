# 🛍️ 오구 (OGOO) — 감정 소비 기록 앱

본 프로젝트는 2026-1 카카오 테크포임팩트 캠퍼스 프로그램의 일환으로 운영된 이화여자대학교 소셜벤처창업 수업에서 진행되었으며, 팀 **오구오구**가 "소비는 자신도 몰랐던 감정의 신호다"라는 문제의식 아래, 소비와 감정을 함께 기록하고 며칠 뒤 다시 들여다보는 **시간차 회고**를 통해 자신의 소비-감정 패턴을 이해하도록 돕는 감정 소비 기록 앱을 개발하였습니다.

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/f2611c6e-d7fe-4c72-9bca-3758621ae588" />

🔗 [서비스 링크(Live Demo)](https://ogoo-9qgr.vercel.app/login) 

---

## Project Overview · 프로젝트 소개

> **"내가 왜 샀는지, 느낌까지 기록해요"**

오구는 금액과 카테고리만 남기는 기존 가계부와 달리, 소비 당시의 **소비 키워드**와 **감정 온도(0~100)** 를 함께 기록합니다. 그리고 며칠이 지난 뒤, 그 소비를 다시 꺼내 별점으로 회고하게 합니다. 감정이 가라앉은 시점에 돌아보면 — "그때 진짜 위로가 됐던 소비"와 "그냥 휩쓸렸던 소비"가 구분되기 시작합니다.

- 감정 소비를 없애야 할 것이 아니라, 내 감정이 소비에 어떻게 반영되는지 이해하는 도구로 접근합니다
- 6가지 감정 키워드(소확행·합리적·스트레스·충동·보상심리·잘 모르겠어요)와 온도 슬라이더로 소비 당시의 감정을 직관적으로 기록합니다
- 구매 직후가 아닌 4일 이상 뒤 다시 떠올리는 시간차 회고로, 감정이 가라앉은 상태에서 소비를 재평가합니다
- 분석 대시보드에서 감정별 소비 패턴을 한눈에 확인할 수 있습니다

---

## 프로젝트 결과 (Resources)

- 📄 [최종 발표자료 PDF](https://github.com/user-attachments/files/29181231/_.pdf)

---

## Team Members — 팀 오구오구

| Role | Name | Responsibility | Contact |
|------|------|------|------|
| PM (리더) / Frontend | 채서윤 | 프로젝트 기획 총괄, UX 설계, 프론트엔드 구현, 발표 | ✉️ [이메일](chaeuniv@ewha.ac.kr) · 🔗 [GitHub](https://github.com/chaeuniv) |
| PM / Backend | 조휘정 | 백엔드 설계 및 구현 | ✉️ [이메일](hwijung@ewha.ac.kr) · 🔗 [GitHub](https://github.com/hvvup) |
| PM / Design | 오민영 | 디자인 총괄 (전반적인 UI/UX 디자인 전담) | ✉️ [이메일](min0h@ewha.ac.kr) |
| PM | 최예주 | PM 업무 중점 진행, 데모 영상 제작 | ✉️ [이메일](2645032@ewha.ac.kr) |


---

## 설치 및 실행 방법 (Installation & Execution)

상단의 서비스 링크에서 배포된 버전을 바로 확인할 수 있습니다. 로컬에서 실행하려면 아래 절차를 따라주세요.

#### 1. 사전 요구사항
- Node.js 18 이상
- PostgreSQL (또는 Supabase 프로젝트)
- Supabase 프로젝트 (Auth + Storage)
- Anthropic API Key (Claude 영수증 OCR)

#### 2. Clone the repository
```bash
git clone https://github.com/chaeuniv/Ogoo.git
cd Ogoo
```

#### 3. .env 파일 생성
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

#### 4. 설치 및 마이그레이션
```bash
npm install            # postinstall에서 prisma generate 자동 실행
npm run db:migrate
```

#### 5. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속

#### 프로덕션 빌드
```bash
npm run build   # prisma generate + next build
npm start
```

#### 기타 DB 명령어
```bash
npm run db:studio    # Prisma Studio (DB GUI)
npm run db:push      # 마이그레이션 없이 스키마 변경사항 반영
npm run db:pull      # DB 스키마를 schema.prisma에 동기화
```

---

## 기술 스택

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

## 프로젝트 구조

```
Ogoo/
├── src/
│   ├── app/
│   │   ├── login/                  # 로그인
│   │   ├── signup/                 # 회원가입
│   │   ├── page.tsx                # 홈 — 오늘의 소비 바구니
│   │   ├── record/
│   │   │   ├── step1/              # 1단계: 사진 촬영/선택
│   │   │   ├── step2/              # 2단계: 날짜·카테고리·금액
│   │   │   ├── step3/              # 3단계: 소비 키워드 선택
│   │   │   ├── step4/              # 4단계: 감정 온도 슬라이더
│   │   │   ├── step5/              # 5단계: 메모·저장
│   │   │   └── step6/              # 6단계: 과거 날짜 경우 소비 별점 리뷰·저장
│   │   ├── logs/
│   │   │   └── [id]/               # 소비 기록 상세
│   │   │       └── share/          # 공유 카드 화면
│   │   ├── analysis/
│   │   │   └── report/             # 분석 리포트 (주간·월간·연간)
│   │   ├── notifications/          # 알림 목록
│   │   ├── my/                     # 마이페이지
│   │   │   ├── edit/               # 프로필 수정
│   │   │   ├── categories/         # 커스텀 카테고리 관리
│   │   │   ├── notifications/      # 알림 설정
│   │   │   ├── privacy/            # 개인정보 처리방침
│   │   │   └── withdraw/           # 회원 탈퇴
│   │   └── api/                    # API 라우트
│   │       ├── consumptions/       # 소비 기록 CRUD, 영수증 OCR
│   │       ├── records/            # 캘린더, 리뷰, 알림 관련
│   │       ├── analysis/           # 분석 데이터
│   │       ├── home/               # 홈 소비 목록
│   │       └── user/               # 유저 정보
│   ├── components/                 # 공통 UI 컴포넌트
│   └── lib/
│       ├── prisma.ts               # Prisma client
│       ├── supabase.ts             # Supabase client
│       ├── supabase-admin.ts       # Supabase Admin client
│       ├── api.ts                  # authFetch 유틸
│       ├── keywords.ts             # 키워드 색상 정의
│       ├── mappings.ts             # enum ↔ 한국어 매핑
│       └── auth.ts                 # 인증 유틸
├── prisma/
│   └── schema.prisma
└── public/
```

---

## 주요 기능 (Key Features & UI Overview)

#### 🧺 홈 — 오늘의 소비 카트
- 오늘 기록한 소비는 소비 키워드와 감정이 조합된 하나의 아이콘으로 카트에 담기는 시각화입니다.
- 카트 아래 "오늘의 소비" 섹션에서는, 오늘 기록한 소비를 사진과 함께 카드로 확인할 수 있습니다.

<img width="1290" height="1092" alt="Image" src="https://github.com/user-attachments/assets/7e4bbf4d-e782-43df-8c3b-01659feadb07" />


#### 📸 소비 기록 — 6단계 위자드
- 사진 촬영/선택 → 카테고리/금액/소비내용 입력 → 소비 키워드 선택(6종) → 감정 온도 슬라이더(0~100) → 메모 -> 저장
- 4일 이상 지난 과거 기록을 남길 때는, 메모 다음 단계에서 소비 만족도 평가를 추가로 진행합니다. 

<img width="3388" height="1167" alt="Image" src="https://github.com/user-attachments/assets/17cd2209-fcfe-4c40-87a7-ad040b61bef6" />


#### 📅 소비 내역 캘린더
- 하루하루의 소비를 소비 키워드 색상 점으로 캘린더에 남깁니다.
- 그 아래엔 아직 회고하지 않은 소비들이 따로 모여 있어, 시간차 회고를 놓치지 않도록 챙겨줍니다.

<img width="447" height="838" alt="Image" src="https://github.com/user-attachments/assets/01de1ee1-9b12-4293-a766-42afa94e49e9" />


#### 📊 분석
- 1주·1개월·6개월·1년 단위로 감정 키워드별 소비를 바 차트로 보여주고, 기간을 넘나들며 과거 패턴과 비교할 수 있습니다.
- 캐릭터가 패턴에 맞는 코멘트를 함께 제공합니다.
- 소비 리포트를 누르면 더 자세한 분석 결과 화면으로 이동합니다.

<img width="3215" height="1092" alt="Image" src="https://github.com/user-attachments/assets/c4b129c7-164c-40c9-bdd5-085f16bcae09" />


#### 👤 마이 페이지
- 총 소비 건수, 대표 카테고리, 대표 감정 통계를 보여주고 커스텀 카테고리(최대 8개)와 프로필, 개인정보를 관리합니다.

<img width="447" height="838" alt="Image" src="https://github.com/user-attachments/assets/b8101caa-57d4-47d8-8515-e7315d5e1c2b" />

---

## Troubleshooting

**문제:** 이미지 저장/공유하기 버튼을 눌러도 아무 반응이 없음
**원인:** Tailwind v4는 색상 유틸리티 클래스(`bg-gray-100` 등)를 `oklch()` CSS 함수로 렌더링하는데, html2canvas가 이 형식을 파싱하지 못해 캡처가 내부적으로 abort됨. 
**해결:** 캡처 영역 내 Tailwind 색상 클래스를 모두 인라인 `style={{ background: '#...' }}`로 교체

**문제:** 분석 리포트 화면이 기기에 따라 내용이 잘리거나 레이아웃이 무너짐
**원인:** 슬라이드 내부 요소 높이가 px 고정값으로 설계되어, 화면이 작은 기기에서 내용이 뷰포트를 초과함
**해결:** iPhone 14 기준 뷰포트 높이(844px)를 `REFERENCE_VIEWPORT_H`로 정의하고, 실제 화면 높이가 더 작을 경우 그 비율만큼 `transform: scale()`로 전체 슬라이드를 자동 축소

**문제:** step4 감정 온도 조정 후 뒤로가기로 돌아오면 온도가 초기값으로 리셋됨
**원인:** `hasDragged` 상태가 로컬 `useState`로만 관리되어 페이지 언마운트 시 소멸. 또한 step3에서 키워드 선택 시 매번 기본 온도로 덮어써서 사용자 조정값이 무시됨
**해결:** `emotionTempSet` 플래그를 RecordProvider(전역 상태)에 저장하고, step3에서 키워드 변경 시에만 온도를 리셋하도록 분기 처리

**문제**: 홈 바구니·기록 상세에서 모든 소비 아이콘이 "합리적 소비"로만 표시됨
**원인**: API 연동 시 응답 필드명(emotion_tag)과 enumToKeyword() 호출 시 keywordLabel 인자 누락이 겹쳐, 모든 키워드가 fallback 값인 "합리적 소비"로 처리됨
**해결**: API 응답 필드명을 프론트 호출과 일치시키고, enumToKeyword(item.emotion_tag, item.keyword_label) 로 두 번째 인자 추가

---

## Future Work
- UI/UX 개선
- 푸시 알림 기능
- 뱃지 시스템
- AI 영수증 인식
- Supabase 플랜 업그레이드

---


## Fellowship & Mentorship

본 프로젝트는 2026-1 카카오 테크포임팩트 캠퍼스 프로그램을 통해, 사회혁신가와 카카오 멘토가 매칭되어 진행되었습니다.

- Fellow (사회혁신가): 이영희 님 (토닥토닥 협동조합 센터장) 🔗 [토닥토닥](https://todactodac.or.kr)
- Mentor (기획, 카카오): bora 님
- Mentor (개발, 카카오): woody 님 🔗 [GitHub](https://github.com/woodying)
