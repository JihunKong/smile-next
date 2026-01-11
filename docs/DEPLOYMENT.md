# SMILE Next.js - AWS 배포 가이드

## AWS EC2 Docker Compose 배포

### 개요

Docker Compose를 사용하여 AWS EC2에 Next.js, PostgreSQL, Redis를 함께 배포합니다.

### 요구 사항

- AWS EC2 인스턴스 (Ubuntu 22.04+)
- Docker 및 Docker Compose 설치
- 포트 80, 443, 3000 열림
- 최소 2GB RAM 권장

## 배포 단계

### 1. EC2 인스턴스 준비

```bash
# Docker 설치
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin

# Docker 권한 설정
sudo usermod -aG docker $USER
newgrp docker

# Docker 서비스 시작
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. 프로젝트 클론

```bash
cd /home/ubuntu
git clone https://github.com/JihunKong/smile-next.git smile-next-repo
cd smile-next-repo
```

### 3. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일 수정:

```env
# Database (Docker 내부 네트워크)
DATABASE_URL="postgresql://smile_user:your_secure_password@db:5432/smile_db"

# Redis (Docker 내부 네트워크)
REDIS_URL="redis://redis:6379"

# Auth
NEXTAUTH_URL="http://your-ec2-ip:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (선택)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AI Services
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

### 4. Docker Compose 배포

```bash
# 이미지 빌드 및 실행
docker compose up -d --build

# 로그 확인
docker compose logs -f
```

### 5. 데이터베이스 초기화

```bash
# 스키마 동기화 (Docker 네트워크 내에서 실행)
docker run --rm --network smile-net \
  -v $(pwd):/app \
  -w /app \
  -e DATABASE_URL="postgresql://smile_user:your_password@db:5432/smile_db" \
  node:20-alpine sh -c "npm install prisma@6.19.1 && npx prisma db push"

# 또는 localhost 포트로 실행 (PostgreSQL 포트가 호스트에 매핑된 경우)
export DATABASE_URL="postgresql://smile_user:your_password@localhost:5432/smile_db"
npx prisma@6.19.1 db push
```

### 6. 시드 데이터 (선택)

```bash
# 테스트 사용자 생성
docker run --rm --network smile-net \
  -v $(pwd):/app \
  -w /app \
  -e DATABASE_URL="postgresql://smile_user:your_password@db:5432/smile_db" \
  node:20-alpine sh -c "npm install && npx prisma db seed"
```

## docker-compose.yml 설정

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: smile-app
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://smile_user:your_password@db:5432/smile_db
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - smile-net

  db:
    image: postgres:16-alpine
    container_name: smile-postgres
    environment:
      POSTGRES_USER: smile_user
      POSTGRES_PASSWORD: your_password
      POSTGRES_DB: smile_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"  # 호스트에서 접근 필요시
    restart: unless-stopped
    networks:
      - smile-net

  redis:
    image: redis:7-alpine
    container_name: smile-redis
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - smile-net

networks:
  smile-net:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

## 도메인 설정

### Nginx 리버스 프록시 (선택)

```bash
sudo apt-get install -y nginx
```

`/etc/nginx/sites-available/smile`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/smile /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 모니터링

### 헬스 체크

```bash
curl http://localhost:3000/api/health
```

응답:
```json
{
  "status": "ok",
  "timestamp": "2024-01-05T00:00:00.000Z",
  "version": "0.1.0"
}
```

### 로그 확인

```bash
# 모든 서비스 로그
docker compose logs -f

# 특정 서비스 로그
docker compose logs -f app

# 최근 100줄
docker compose logs --tail=100 app
```

### 컨테이너 상태

```bash
docker compose ps
docker stats
```

## 업데이트 배포

```bash
cd /home/ubuntu/smile-next-repo

# 최신 코드 가져오기
git pull origin main

# 이미지 재빌드 및 재시작
docker compose up -d --build

# 이전 이미지 정리
docker image prune -f
```

## 롤백

```bash
# 이전 커밋으로 되돌리기
git log --oneline -5  # 커밋 확인
git checkout <commit-hash>

# 재빌드
docker compose up -d --build
```

## 문제 해결

### 데이터베이스 연결 오류

```bash
# PostgreSQL 컨테이너 상태 확인
docker compose ps db

# 로그 확인
docker compose logs db

# 수동 연결 테스트
docker exec -it smile-postgres psql -U smile_user -d smile_db -c '\dt'
```

### 메모리 부족

```bash
# 메모리 사용량 확인
free -h
docker stats

# 불필요한 이미지 정리
docker system prune -a
```

### 빌드 실패

```bash
# 로컬에서 빌드 테스트
npm run build

# Docker 빌드 로그 확인
docker compose build --no-cache 2>&1 | tee build.log
```

### 포트 충돌

```bash
# 사용 중인 포트 확인
sudo lsof -i :3000
sudo lsof -i :5432

# 기존 컨테이너 정리
docker compose down
docker rm -f smile-app smile-postgres smile-redis
```
