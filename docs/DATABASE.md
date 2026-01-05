# SMILE Next.js - 데이터베이스

## 개요

Prisma ORM을 사용하여 PostgreSQL 데이터베이스를 관리합니다.

## 스키마 구조

### 핵심 모델

```
┌─────────────┐       ┌─────────────┐
│    User     │◄──────│    Role     │
└──────┬──────┘       └─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐       ┌─────────────┐
│   Group     │◄──────│  GroupUser  │
└──────┬──────┘       └─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐
│  Activity   │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐       ┌─────────────────────┐
│  Question   │──────►│ QuestionEvaluation  │
└──────┬──────┘       └─────────────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐
│  Response   │
└─────────────┘
```

## 모델 상세

### User (사용자)

```prisma
model User {
  id                String    @id @default(uuid())
  email             String    @unique
  username          String?   @unique
  passwordHash      String?
  firstName         String?
  lastName          String?

  // Avatar
  avatarPublicId    String?
  avatarUrl         String?

  // Role (0=Super Admin, 1=Admin, 2=Teacher, 3=Student)
  roleId            Int       @default(3)

  // Account status
  isBlocked         Boolean   @default(false)
  isDeleted         Boolean   @default(false)
  emailVerified     Boolean   @default(false)

  // Relations
  createdGroups     Group[]
  groupMemberships  GroupUser[]
  createdActivities Activity[]
  createdQuestions  Question[]
  responses         Response[]
}
```

### Group (그룹)

```prisma
model Group {
  id              String    @id @default(uuid())
  creatorId       String
  name            String    @default("")
  description     String?

  // Settings
  groupType       String    @default("StudentPaced")
  requirePasscode Boolean   @default(false)
  passcode        String?
  isPrivate       Boolean   @default(false)
  isDeleted       Boolean   @default(false)

  // Invite
  inviteCode      String?   @unique

  // Relations
  creator         User      @relation(fields: [creatorId], references: [id])
  members         GroupUser[]
  activities      Activity[]
}
```

### Activity (활동)

```prisma
model Activity {
  id                String    @id @default(uuid())
  creatorId         String
  name              String
  description       String?

  // Settings
  activityType      String    @default("Open Mode")
  aiRatingEnabled   Boolean   @default(true)
  mode              Int       @default(0)  // 0=Open, 1=Exam, 2=Inquiry

  // Mode settings (JSON)
  examSettings      Json?
  inquirySettings   Json?
  openModeSettings  Json?

  // School context
  educationLevel    String?
  schoolSubject     String?
  topic             String?

  // Relations
  owningGroup       Group     @relation(fields: [owningGroupId], references: [id])
  questions         Question[]
  examAttempts      ExamAttempt[]
}
```

### Question (질문)

```prisma
model Question {
  id                    String    @id @default(uuid())
  creatorId             String
  content               String
  activityId            String

  // Type
  questionType          String?
  isAnonymous           Boolean   @default(false)

  // Multiple choice
  choices               Json?     @default("[]")
  correctAnswers        Json?     @default("[]")

  // Statistics
  ratings               Float     @default(0.0)
  viewCount             Int       @default(0)
  numberOfAnswers       Int       @default(0)

  // AI Evaluation
  questionEvaluationId  String?
  questionEvaluationScore Float?

  // Relations
  creator               User      @relation(fields: [creatorId], references: [id])
  activity              Activity  @relation(fields: [activityId], references: [id])
  responses             Response[]
  evaluation            QuestionEvaluation?
}
```

### QuestionEvaluation (AI 평가)

```prisma
model QuestionEvaluation {
  id                String    @id @default(uuid())
  questionId        String
  activityId        String

  // AI Model
  aiModel           String    @default("gpt-4-turbo")

  // Bloom's Taxonomy
  bloomsLevel       String?   // remember, understand, apply, analyze, evaluate, create
  bloomsConfidence  Float?

  // Scores (0-10)
  overallScore      Float     @default(0.0)
  creativityScore   Float?
  clarityScore      Float?
  relevanceScore    Float?
  innovationScore   Float?

  // Feedback
  evaluationText    String?
  strengths         Json?     @default("[]")
  improvements      Json?     @default("[]")
  enhancedQuestions Json?     @default("[]")

  // Status
  evaluationStatus  String    @default("completed")

  // Relations
  activity          Activity  @relation(fields: [activityId], references: [id])
  questions         Question[]
}
```

## 마이그레이션

### 개발 환경

```bash
# 스키마 변경 후 마이그레이션 생성
npm run db:migrate

# 스키마를 DB에 직접 동기화 (개발용)
npm run db:push

# Prisma Studio로 데이터 확인
npm run db:studio
```

### 프로덕션 환경

```bash
# 마이그레이션 적용
npx prisma migrate deploy
```

## 쿼리 예제

### 사용자 조회

```typescript
import { prisma } from '@/lib/db/prisma'

// 이메일로 사용자 찾기
const user = await prisma.user.findUnique({
  where: { email: 'test@test.com' }
})

// 사용자와 그룹 함께 조회
const userWithGroups = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    groupMemberships: {
      include: { group: true }
    }
  }
})
```

### 그룹 및 활동 조회

```typescript
// 그룹의 모든 활동 조회
const activities = await prisma.activity.findMany({
  where: {
    owningGroupId: groupId,
    isDeleted: false
  },
  orderBy: { position: 'asc' }
})

// 활동의 질문과 평가 조회
const questions = await prisma.question.findMany({
  where: { activityId, isDeleted: false },
  include: { evaluation: true },
  orderBy: { createdAt: 'desc' }
})
```

### 통계 쿼리

```typescript
// 활동별 질문 수 집계
const stats = await prisma.activity.findMany({
  where: { owningGroupId: groupId },
  include: {
    _count: {
      select: { questions: true }
    }
  }
})

// 사용자별 질문 평균 점수
const avgScore = await prisma.questionEvaluation.aggregate({
  where: {
    activity: {
      questions: {
        some: { creatorId: userId }
      }
    }
  },
  _avg: { overallScore: true }
})
```

## 인덱스

성능 최적화를 위해 자주 조회되는 필드에 인덱스가 설정되어 있습니다:

```prisma
model User {
  // ...
  @@index([email])
  @@index([isDeleted])
}

model Question {
  // ...
  @@index([creatorId])
  @@index([activityId])
  @@index([isDeleted])
}
```

## 관계 다이어그램

```
User ──1:N──► Group (creator)
User ──N:M──► Group (via GroupUser)
User ──1:N──► Activity
User ──1:N──► Question
User ──1:N──► Response

Group ──1:N──► Activity
Activity ──1:N──► Question
Question ──1:1──► QuestionEvaluation
Question ──1:N──► Response
Question ──1:N──► Like

Activity ──1:N──► ExamAttempt
ExamAttempt ──1:N──► Response
```
