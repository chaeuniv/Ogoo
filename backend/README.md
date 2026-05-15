# ogoo-backend

Node.js + TypeScript + Prisma + PostgreSQL 백엔드 서버입니다.

## 기술 스택

- **Runtime**: Node.js 22
- **Language**: TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL 16

## 빠른 시작 (Docker)

> 로컬에 Node.js나 PostgreSQL 없이 Docker만으로 실행할 수 있습니다.

**1. 환경변수 설정**

```bash
cp .env.example .env
```

필요하면 `.env`의 비밀번호 등을 수정하세요.

**2. 실행**

```bash
docker compose up --build
```

앱 컨테이너가 뜰 때 DB 마이그레이션이 자동으로 적용됩니다.

**3. 확인**

```bash
curl http://localhost:3000/health
# {"status":"ok","db":"connected"}
```

---

## 로컬 개발 환경

### 사전 준비

- Node.js 22+
- PostgreSQL 16+ (또는 `docker compose up db`로 DB만 실행)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env의 DATABASE_URL을 로컬 PostgreSQL에 맞게 수정

# Prisma 클라이언트 생성
npx prisma generate

# DB 마이그레이션 적용
npx prisma migrate deploy

# 개발 서버 실행 (핫리로드)
npm run dev
```

### 유용한 명령어

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 (핫리로드) |
| `npm run build` | TypeScript 빌드 |
| `npm start` | 빌드된 서버 실행 |
| `npx prisma migrate dev --name <name>` | 마이그레이션 생성 및 적용 |
| `npx prisma migrate deploy` | 마이그레이션 적용 (운영용) |
| `npx prisma studio` | DB 데이터 GUI 확인 |

---

## 프로젝트 구조

```
src/
├── index.ts          # 서버 진입점
├── app.ts            # Express 앱, 미들웨어, 라우터 등록
├── lib/
│   └── prisma.ts     # Prisma 클라이언트 싱글톤
└── routes/
    └── health.ts     # GET /health
prisma/
└── schema.prisma     # DB 스키마 정의
```

## 환경변수

| 변수 | 설명 | 기본값 |
|---|---|---|
| `NODE_ENV` | 실행 환경 | `development` |
| `PORT` | 서버 포트 | `3000` |
| `DATABASE_URL` | PostgreSQL 연결 문자열 | - |

## API

| 메서드 | 경로 | 설명 |
|---|---|---|
| `GET` | `/health` | 서버 및 DB 연결 상태 확인 |

## 새 API 추가하기

1. `src/routes/` 아래에 라우터 파일 생성
2. `src/app.ts`에 라우터 등록
3. 필요한 경우 `prisma/schema.prisma`에 모델 추가 후 마이그레이션

```bash
npx prisma migrate dev --name add_something
```
