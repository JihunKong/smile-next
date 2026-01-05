# SMILE Next.js - 아키텍처

## 시스템 개요

SMILE Next.js는 기존 Flask/Python 백엔드를 Next.js 풀스택으로 마이그레이션한 프로젝트입니다.

```
┌─────────────────────────────────────────────────────┐
│                    Next.js 16                        │
│  ┌───────────────────────────────────────────────┐  │
│  │              App Router (RSC)                  │  │
│  │  ├── Server Components (기본)                 │  │
│  │  ├── Client Components ('use client')         │  │
│  │  └── Server Actions (form handling)           │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │              API Routes                        │  │
│  │  ├── /api/auth/* (NextAuth.js)                │  │
│  │  ├── /api/health (헬스 체크)                  │  │
│  │  └── /api/* (외부 통합)                       │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│                   서비스 레이어                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   Prisma    │  │    Auth     │  │     AI      │  │
│  │   (ORM)     │  │ (NextAuth)  │  │  (OpenAI/   │  │
│  │             │  │             │  │   Claude)   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
│         │                │                │         │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  │
│  │ PostgreSQL  │  │   Google    │  │  Bull Queue │  │
│  │             │  │   OAuth     │  │   (Redis)   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Flask → Next.js 마이그레이션

### 이전 아키텍처 (Flask)

```
Flask Backend (Python)
├── 27 route blueprints (23,000+ lines)
├── 30 services (AI, analytics, etc.)
├── SQLAlchemy models (24 models)
├── Celery + Redis (background jobs)
└── Jinja2 templates (82 files, 98,000 lines)

문제점:
- CSRF 보호 비활성화
- 타입 안전성 없음
- 스택 트레이스 노출
- 테스트 커버리지 0%
```

### 새 아키텍처 (Next.js)

```
Next.js Full-Stack (TypeScript)
├── App Router + Server Components
├── Prisma ORM (24 models)
├── OpenAI/Anthropic Node SDKs
├── Bull Queue + Redis
└── NextAuth.js (Google OAuth)

개선점:
- 100% TypeScript
- 내장 보안 기능
- RSC로 성능 최적화
- 타입 안전 쿼리
```

## 핵심 컴포넌트

### 1. 인증 (NextAuth.js)

```typescript
// src/lib/auth/config.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({...}),      // Google OAuth
    Credentials({...})  // 이메일/비밀번호
  ],
  session: { strategy: 'jwt' }
})
```

**특징:**
- JWT 기반 세션
- Google OAuth 통합
- Prisma 어댑터로 DB 연동

### 2. 데이터베이스 (Prisma)

```typescript
// src/lib/db/prisma.ts
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
})
```

**모델 구조:**
- User, Role, Permission
- Group, GroupUser
- Activity, Question, Response
- QuestionEvaluation
- ExamAttempt, InquiryAttempt
- Leaderboard, Subscription

### 3. AI 서비스

```
┌─────────────────────────────────────────────────────┐
│                    AI Services                       │
├─────────────────────────────────────────────────────┤
│  OpenAI (GPT-4o)           │  Claude (Sonnet 4.5)   │
│  ├── 질문 평가             │  ├── Bloom's 가이드   │
│  ├── 품질 점수             │  ├── 교육 피드백      │
│  └── 향상된 질문 생성      │  └── 케이스 시나리오  │
├─────────────────────────────────────────────────────┤
│                   Bull Queue                         │
│  ├── 비동기 평가 작업                               │
│  ├── 재시도 로직 (3회)                              │
│  └── 지수 백오프                                    │
└─────────────────────────────────────────────────────┘
```

### 4. 백그라운드 작업 (Bull Queue)

```typescript
// src/lib/queue/bull.ts
export const evaluationQueue = new Queue('question-evaluations', {
  redis: process.env.REDIS_URL,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60000 }
  }
})
```

**큐 종류:**
- `evaluationQueue`: 질문 AI 평가
- `responseEvaluationQueue`: 응답 AI 평가
- `emailQueue`: 이메일 발송
- `leaderboardQueue`: 리더보드 업데이트

## 데이터 흐름

### 질문 생성 및 평가

```
1. 학생이 질문 작성
   └─> POST /api/questions

2. Server Action 처리
   └─> Prisma로 DB 저장
   └─> Bull Queue에 평가 작업 추가

3. 백그라운드 워커
   └─> OpenAI API 호출
   └─> 평가 결과 저장
   └─> 리더보드 업데이트

4. 클라이언트 업데이트
   └─> 폴링 또는 Server Actions
   └─> UI 갱신
```

## 디렉토리 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 페이지 그룹
│   ├── (dashboard)/       # 대시보드 페이지 그룹
│   ├── (admin)/           # 관리자 페이지 그룹
│   └── api/               # API 라우트
├── components/            # React 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   ├── forms/            # 폼 컴포넌트
│   └── dashboard/        # 대시보드 위젯
├── lib/                   # 핵심 라이브러리
│   ├── ai/               # AI 서비스
│   ├── auth/             # 인증 설정
│   ├── db/               # 데이터베이스
│   └── queue/            # 백그라운드 큐
└── types/                 # TypeScript 타입
```

## 보안 고려사항

| 항목 | Flask (이전) | Next.js (현재) |
|------|-------------|----------------|
| CSRF | 비활성화 | 내장 보호 |
| XSS | 수동 이스케이프 | React 자동 이스케이프 |
| SQL Injection | SQLAlchemy | Prisma (파라미터화) |
| 인증 | Flask-Login | NextAuth.js (JWT) |
| 타입 체크 | 없음 | TypeScript |

## 성능 최적화

1. **Server Components**: 기본적으로 서버에서 렌더링
2. **Streaming**: 점진적 UI 로딩
3. **Prisma 쿼리 최적화**: 필요한 필드만 선택
4. **Redis 캐싱**: 빈번한 조회 캐시
5. **Bull Queue**: 무거운 작업 비동기 처리
