# SMILE Next.js

SMILE 교육 플랫폼의 Next.js 풀스택 리빌드 프로젝트입니다.

## 기술 스택

| 카테고리 | 기술 | 버전 |
|----------|------|------|
| **Framework** | Next.js | 16.1.1 |
| **Language** | TypeScript | ^5 |
| **Runtime** | React | 19.2.3 |
| **ORM** | Prisma | ^6.19.1 |
| **Auth** | NextAuth.js | ^5.0.0-beta.30 |
| **AI** | OpenAI SDK | ^6.15.0 |
| **AI** | Anthropic SDK | ^0.71.2 |
| **Queue** | Bull | ^4.16.5 |
| **Styling** | Tailwind CSS | ^4 |

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 필요한 값을 설정하세요.

### 3. 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 스키마 동기화 (개발용)
npm run db:push

# 또는 마이그레이션 생성 (프로덕션용)
npm run db:migrate
```

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 프로젝트 구조

```
smile-next/
├── prisma/
│   └── schema.prisma      # 데이터베이스 스키마 (20+ 모델)
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API 라우트
│   │   │   ├── auth/      # NextAuth.js 엔드포인트
│   │   │   └── health/    # 헬스 체크
│   │   ├── layout.tsx     # 루트 레이아웃
│   │   └── page.tsx       # 홈 페이지
│   ├── lib/               # 핵심 라이브러리
│   │   ├── ai/            # AI 서비스
│   │   │   ├── openai.ts  # OpenAI 질문 평가
│   │   │   └── claude.ts  # Claude Bloom's 가이드
│   │   ├── auth/          # 인증 설정
│   │   │   └── config.ts  # NextAuth 설정
│   │   ├── db/            # 데이터베이스
│   │   │   └── prisma.ts  # Prisma 클라이언트
│   │   └── queue/         # 백그라운드 작업
│   │       └── bull.ts    # Bull Queue 설정
│   └── types/             # TypeScript 타입 정의
├── docs/                  # 프로젝트 문서
├── workers/               # 백그라운드 워커
├── .env.example           # 환경 변수 템플릿
├── Dockerfile             # Docker 빌드 설정
└── railway.json           # Railway 배포 설정
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run format` | Prettier 포맷팅 |
| `npm run db:generate` | Prisma 클라이언트 생성 |
| `npm run db:push` | 스키마를 DB에 동기화 |
| `npm run db:migrate` | 마이그레이션 생성 및 적용 |
| `npm run db:studio` | Prisma Studio 실행 |

## 환경 변수

`.env.example` 파일 참조:

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AI Services
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Redis (Queue)
REDIS_URL="redis://localhost:6379"
```

## 문서

- [아키텍처](docs/ARCHITECTURE.md) - 시스템 구조 및 설계
- [개발 가이드](docs/DEVELOPMENT.md) - 개발 환경 및 가이드라인
- [배포 가이드](docs/DEPLOYMENT.md) - Railway 배포 방법
- [데이터베이스](docs/DATABASE.md) - Prisma 스키마 설명
- [AI 서비스](docs/AI_SERVICES.md) - OpenAI/Claude 통합

## 라이선스

Private - Seeds of Empowerment
