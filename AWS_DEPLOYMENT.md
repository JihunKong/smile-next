# AWS EC2 배포 가이드

## 1. EC2 인스턴스 생성

### 권장 사양
| 항목 | 값 |
|------|---|
| 인스턴스 타입 | **t3.micro** (1GB) 또는 **t3.small** (2GB) |
| AMI | Ubuntu Server 22.04 LTS |
| 스토리지 | 20GB gp3 |
| 보안 그룹 | 80, 443, 22 포트 열기 |

### 예상 비용 (서울 리전)
- t3.micro: ~$7.5/월
- t3.small: ~$15/월
- 스토리지 20GB: ~$1.6/월
- **총계**: ~$9-17/월

## 2. 초기 설정

SSH로 인스턴스 접속 후:

```bash
# 1. 설정 스크립트 다운로드 및 실행
curl -O https://raw.githubusercontent.com/JihunKong/smile-next/main/aws-setup.sh
chmod +x aws-setup.sh
./aws-setup.sh

# 2. 재로그인 (Docker 그룹 적용)
exit
# SSH 재접속

# 3. 레포지토리 클론
git clone https://github.com/JihunKong/smile-next.git /opt/smile/app
cd /opt/smile/app
```

## 3. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.template .env
nano .env
```

필수 환경 변수:
```env
DB_PASSWORD=강력한_비밀번호_입력
NEXTAUTH_URL=http://your-ec2-public-ip
NEXT_PUBLIC_APP_URL=http://your-ec2-public-ip
AUTH_SECRET=openssl_rand_base64_32_결과값

# AI 서비스 (최소 하나 필요)
OPENAI_API_KEY=sk-...
# 또는
ANTHROPIC_API_KEY=sk-ant-...
```

## 4. 배포

```bash
cd /opt/smile/app

# 이미지 빌드
docker-compose -f docker-compose.prod.yml build

# 컨테이너 시작
docker-compose -f docker-compose.prod.yml up -d

# 데이터베이스 스키마 적용
docker exec smile-app npx prisma db push

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f
```

## 5. 확인

```bash
# 컨테이너 상태
docker-compose -f docker-compose.prod.yml ps

# 메모리 사용량
docker stats --no-stream

# 앱 테스트
curl http://localhost
```

## 6. SSL 설정 (선택사항)

### Caddy 사용 (권장)

```bash
# Caddy 설치
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Caddyfile 설정
sudo nano /etc/caddy/Caddyfile
```

```
your-domain.com {
    reverse_proxy localhost:3000
}
```

```bash
sudo systemctl reload caddy
```

## 7. 유지보수

### 업데이트 배포
```bash
cd /opt/smile/app
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### 데이터 백업
```bash
# PostgreSQL 백업
docker exec smile-postgres pg_dump -U smile_user smile_db > backup_$(date +%Y%m%d).sql

# 복원
cat backup.sql | docker exec -i smile-postgres psql -U smile_user smile_db
```

### 로그 확인
```bash
docker-compose -f docker-compose.prod.yml logs app --tail 100
docker-compose -f docker-compose.prod.yml logs db --tail 100
```

## 8. 모니터링

### 간단한 상태 확인
```bash
# 크론탭에 추가
*/5 * * * * curl -sf http://localhost/api/health || echo "SMILE is down" | mail -s "Alert" admin@example.com
```

### CloudWatch (선택)
- EC2 인스턴스 모니터링 활성화
- CPU, 메모리 알람 설정

## 트러블슈팅

### 메모리 부족
```bash
# 스왑 파일 추가
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 컨테이너 재시작
```bash
docker-compose -f docker-compose.prod.yml restart app
```

### 전체 재설정
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```
