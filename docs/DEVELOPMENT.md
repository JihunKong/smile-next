# SMILE Next.js - 개발 가이드

## 개발 환경 설정

### 필수 요구사항

- Node.js 20.x 이상
- npm 10.x 이상
- PostgreSQL 15+ (로컬 또는 원격)
- Redis 7+ (Bull Queue용)

### 1. 저장소 클론

```bash
git clone https://github.com/JihunKong/smile-next.git
cd smile-next
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일 편집:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/smile_db"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="openssl rand -base64 32로 생성"
GOOGLE_CLIENT_ID="Google Cloud Console에서 발급"
GOOGLE_CLIENT_SECRET="Google Cloud Console에서 발급"

# AI
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Redis
REDIS_URL="redis://localhost:6379"
```

### 4. 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 개발 DB에 스키마 동기화
npm run db:push

# (선택) Prisma Studio로 데이터 확인
npm run db:studio
```

### 5. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인

## 코드 스타일

### TypeScript 규칙

```typescript
// 인터페이스는 I 접두사 없이
interface User {
  id: string
  email: string
}

// 타입은 명시적으로
const user: User = { id: '1', email: 'test@test.com' }

// async/await 사용
async function getUser(id: string): Promise<User> {
  return await prisma.user.findUnique({ where: { id } })
}
```

### 파일 구조 규칙

```
src/
├── app/
│   └── (group)/
│       └── page-name/
│           ├── page.tsx      # 페이지 컴포넌트
│           ├── layout.tsx    # 레이아웃 (선택)
│           ├── loading.tsx   # 로딩 UI (선택)
│           └── error.tsx     # 에러 UI (선택)
├── components/
│   └── ComponentName/
│       ├── index.tsx         # 메인 컴포넌트
│       ├── ComponentName.tsx # (또는 단일 파일)
│       └── types.ts          # 타입 정의 (선택)
└── lib/
    └── feature/
        ├── index.ts          # 공개 API
        ├── service.ts        # 비즈니스 로직
        └── types.ts          # 타입 정의
```

### 컴포넌트 작성

```tsx
// Server Component (기본)
export default async function UserList() {
  const users = await prisma.user.findMany()
  return <ul>{users.map(u => <li key={u.id}>{u.email}</li>)}</ul>
}

// Client Component (상호작용 필요시)
'use client'
import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

### Server Actions

```tsx
// app/actions.ts
'use server'
import { prisma } from '@/lib/db/prisma'

export async function createQuestion(formData: FormData) {
  const content = formData.get('content') as string

  const question = await prisma.question.create({
    data: { content, creatorId: '...' }
  })

  return { success: true, question }
}
```

## Git 워크플로우

### 브랜치 전략

```
main
├── develop
│   ├── feature/add-login
│   ├── feature/question-form
│   └── fix/auth-error
└── release/v1.0.0
```

### 커밋 메시지

```
type(scope): description

type:
- feat: 새 기능
- fix: 버그 수정
- docs: 문서 변경
- style: 코드 포맷팅
- refactor: 리팩토링
- test: 테스트 추가
- chore: 빌드/설정 변경

예시:
feat(auth): add Google OAuth login
fix(question): resolve evaluation timeout
docs(readme): update quick start guide
```

### PR 프로세스

1. 기능 브랜치 생성: `git checkout -b feature/xxx`
2. 작업 및 커밋
3. PR 생성 (develop 브랜치로)
4. 코드 리뷰
5. 머지

## 테스트

### 단위 테스트 (예정)

```bash
npm run test
```

### E2E 테스트 (예정)

```bash
npm run test:e2e
```

## 디버깅

### Prisma 쿼리 로그

개발 모드에서 자동으로 쿼리 로그가 출력됩니다.

### API 디버깅

```typescript
// API 라우트에서
export async function GET(request: Request) {
  console.log('Request:', request.url)
  // ...
}
```

### 클라이언트 디버깅

React DevTools와 브라우저 개발자 도구 사용

## 유용한 명령어

```bash
# 개발 서버 (Turbopack)
npm run dev

# 프로덕션 빌드
npm run build

# 린트 검사
npm run lint

# 코드 포맷팅
npm run format

# Prisma Studio
npm run db:studio

# 타입 체크
npx tsc --noEmit
```

## 문제 해결

### "Cannot find module '@prisma/client'"

```bash
npm run db:generate
```

### "NEXTAUTH_SECRET is not set"

`.env.local`에 NEXTAUTH_SECRET 추가:

```bash
openssl rand -base64 32
```

### PostgreSQL 연결 오류

1. PostgreSQL 서비스 실행 확인
2. DATABASE_URL 형식 확인
3. 방화벽/네트워크 확인
