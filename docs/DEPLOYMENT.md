# SMILE Next.js - 배포 가이드

## Railway 배포

### 개요

Railway는 PostgreSQL, Redis를 포함한 풀스택 배포를 지원하는 플랫폼입니다.

### 예상 비용

| 서비스 | 월 비용 |
|--------|---------|
| Next.js App | ~$10-15 |
| Bull Worker | ~$5-10 |
| PostgreSQL | ~$5 |
| Redis | ~$3 |
| **Total** | **~$30-40** |

### 배포 단계

#### 1. Railway 프로젝트 생성

```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 연결 (GitHub 연동)
railway link
```

#### 2. 서비스 추가

Railway 대시보드에서:

1. **PostgreSQL 추가**
   - "New" → "Database" → "PostgreSQL"
   - 자동으로 `DATABASE_URL` 환경 변수 생성

2. **Redis 추가**
   - "New" → "Database" → "Redis"
   - 자동으로 `REDIS_URL` 환경 변수 생성

#### 3. 환경 변수 설정

Railway 대시보드 → Variables:

```env
# 자동 설정됨
DATABASE_URL=...
REDIS_URL=...

# 수동 설정 필요
NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

#### 4. 배포

```bash
# 수동 배포
railway up

# 또는 GitHub 푸시로 자동 배포
git push origin main
```

### Dockerfile 설정

프로젝트에 포함된 `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# 의존성 설치
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# 빌드
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# 실행
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
CMD ["node", "server.js"]
```

### railway.json 설정

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

## 도메인 설정

### Railway 도메인

1. Railway 대시보드 → Settings → Domains
2. "Generate Domain" 클릭
3. `xxx.railway.app` 형식의 도메인 생성

### 커스텀 도메인

1. Settings → Domains → "Add Custom Domain"
2. 도메인 입력 (예: `smile-next.example.com`)
3. DNS 레코드 설정:
   ```
   CNAME smile-next -> xxx.railway.app
   ```

### HTTPS

Railway에서 자동으로 SSL 인증서 발급 및 갱신

## 데이터베이스 마이그레이션

### 초기 마이그레이션

```bash
# 로컬에서 마이그레이션 파일 생성
npx prisma migrate dev --name init

# Railway에서 마이그레이션 적용
railway run npx prisma migrate deploy
```

### 스키마 변경 시

```bash
# 1. 로컬에서 스키마 수정
# 2. 마이그레이션 생성
npx prisma migrate dev --name add_new_field

# 3. 커밋 & 푸시
git add .
git commit -m "feat(db): add new field"
git push origin main

# 4. Railway에서 마이그레이션 (자동 또는 수동)
railway run npx prisma migrate deploy
```

## 모니터링

### Railway Metrics

- CPU 사용량
- 메모리 사용량
- 네트워크 트래픽

### 로그 확인

```bash
# 실시간 로그
railway logs

# 또는 대시보드에서 확인
```

### 헬스 체크

```bash
curl https://your-app.railway.app/api/health
```

응답:
```json
{
  "status": "ok",
  "timestamp": "2024-01-05T00:00:00.000Z",
  "version": "0.1.0"
}
```

## 롤백

### Railway 대시보드

1. Deployments 탭
2. 이전 배포 선택
3. "Redeploy" 클릭

### Git 기반

```bash
# 이전 커밋으로 되돌리기
git revert HEAD
git push origin main
# 자동 재배포
```

## CI/CD (예정)

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: railwayapp/railway-action@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
```

## 문제 해결

### 빌드 실패

1. 로그 확인: `railway logs`
2. 로컬 빌드 테스트: `npm run build`
3. Dockerfile 확인

### 데이터베이스 연결 오류

1. DATABASE_URL 환경 변수 확인
2. Prisma 클라이언트 생성 확인
3. 네트워크 정책 확인

### 메모리 부족

1. Railway 플랜 업그레이드
2. 메모리 최적화 (예: 이미지 압축)
