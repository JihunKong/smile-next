# SMILE Next.js - AI 서비스

## 개요

SMILE는 두 가지 AI 서비스를 사용합니다:
- **OpenAI (GPT-4o)**: 질문 평가, 품질 점수, 향상된 질문 생성
- **Anthropic Claude**: Bloom's Taxonomy 가이드, 교육 피드백, 케이스 시나리오

## OpenAI 서비스

### 위치
`src/lib/ai/openai.ts`

### 주요 기능

#### 1. 질문 평가 (evaluateQuestion)

학생이 작성한 질문을 AI가 분석하여 품질 점수와 피드백을 제공합니다.

```typescript
import { evaluateQuestion } from '@/lib/ai/openai'

const result = await evaluateQuestion({
  question: "기후 변화가 해양 생태계에 미치는 영향은?",
  activityName: "환경 과학",
  groupName: "과학반",
  educationLevel: "high-school",
  subject: "과학",
  topic: "기후 변화"
})
```

**반환값:**
```typescript
{
  overallScore: 8.5,           // 전체 품질 점수 (0-10)
  bloomsLevel: "analyze",       // Bloom's 레벨
  bloomsConfidence: 0.85,       // 신뢰도 (0-1)
  creativityScore: 7.0,         // 창의성 점수
  clarityScore: 9.0,            // 명확성 점수
  relevanceScore: 8.5,          // 관련성 점수
  innovationScore: 7.5,         // 혁신성 점수
  evaluationText: "이 질문은...",
  strengths: ["명확한 주제", "분석적 접근"],
  improvements: ["더 구체적인 범위 설정"],
  enhancedQuestions: [
    "해양 산성화가 산호초에 미치는 영향은?",
    // ... 3개 더
  ]
}
```

#### 2. 향상된 질문 생성 (generateEnhancedQuestions)

원본 질문을 더 높은 Bloom's 레벨로 개선한 버전을 생성합니다.

```typescript
import { generateEnhancedQuestions } from '@/lib/ai/openai'

const enhanced = await generateEnhancedQuestions(
  "광합성이란 무엇인가?",  // 원본 질문
  "evaluate",              // 목표 Bloom's 레벨
  {
    activityName: "생물학",
    subject: "과학",
    topic: "식물 생리학"
  }
)
// ["광합성 효율을 높이는 방법을 평가하면?", ...]
```

## Claude 서비스

### 위치
`src/lib/ai/claude.ts`

### 주요 기능

#### 1. Bloom's 가이드 생성 (generateBloomsGuidance)

질문의 현재 Bloom's 레벨을 분석하고 개선 가이드를 제공합니다.

```typescript
import { generateBloomsGuidance } from '@/lib/ai/claude'

const guidance = await generateBloomsGuidance(
  "광합성이란 무엇인가?",
  "remember",  // 현재 레벨
  {
    subject: "생물학",
    topic: "식물",
    educationLevel: "high-school"
  }
)
```

**반환값:**
```typescript
{
  currentLevel: "remember",
  levelDescription: "단순 기억 및 회상 수준의 질문입니다.",
  nextLevelSuggestions: [
    "광합성의 각 단계를 자신의 말로 설명해 보세요.",
    "광합성과 호흡의 차이를 비교해 보세요."
  ],
  pedagogicalTips: [
    "Why와 How로 시작하는 질문을 유도하세요."
  ],
  exampleQuestions: [
    { level: "remember", question: "광합성이란 무엇인가?" },
    { level: "understand", question: "광합성 과정을 설명하세요." },
    { level: "apply", question: "광합성을 농업에 어떻게 활용할까?" },
    { level: "analyze", question: "C3와 C4 식물의 광합성 차이는?" },
    { level: "evaluate", question: "광합성 효율을 높이는 방법을 평가하면?" },
    { level: "create", question: "광합성을 개선하는 새로운 방법을 설계하라." }
  ]
}
```

#### 2. 시험 코칭 (provideExamCoaching)

시험 모드에서 학생 답변에 대한 개인화된 피드백을 제공합니다.

```typescript
import { provideExamCoaching } from '@/lib/ai/claude'

const coaching = await provideExamCoaching(
  "대한민국의 수도는?",      // 질문
  "부산",                    // 학생 답변
  "서울",                    // 정답
  false                      // 정답 여부
)
```

**반환값:**
```typescript
{
  feedback: "부산은 대한민국의 두 번째로 큰 도시이지만...",
  encouragement: "좋은 시도였어요! 다시 한번 생각해 보세요.",
  nextSteps: [
    "대한민국의 주요 도시들을 복습해 보세요.",
    "수도와 광역시의 차이를 알아보세요."
  ],
  resources: ["한국 지리", "행정 구역"]
}
```

#### 3. 케이스 시나리오 생성 (generateCaseScenario)

특정 주제에 대한 교육용 케이스 스터디를 생성합니다.

```typescript
import { generateCaseScenario } from '@/lib/ai/claude'

const scenario = await generateCaseScenario(
  "기업 윤리",
  {
    subject: "경영학",
    educationLevel: "undergraduate",
    complexity: "intermediate"
  }
)
```

**반환값:**
```typescript
{
  scenario: "A 기업의 CFO는 분기 실적 발표를 앞두고...",
  questions: [
    "CFO의 딜레마는 무엇인가?",
    "이 상황에서 이해관계자들은 누구인가?",
    // ...
  ],
  learningObjectives: [
    "기업 윤리의 중요성 이해",
    "이해관계자 분석 능력 개발"
  ]
}
```

## Bull Queue 통합

### 비동기 평가 처리

무거운 AI 작업은 Bull Queue로 비동기 처리합니다.

```typescript
import { queueQuestionEvaluation } from '@/lib/queue/bull'

// 질문 생성 시 평가 큐에 추가
await queueQuestionEvaluation({
  questionId: question.id,
  activityId: activity.id,
  userId: user.id,
  questionContent: question.content,
  context: {
    activityName: activity.name,
    groupName: group.name,
    educationLevel: activity.educationLevel,
    subject: activity.schoolSubject,
    topic: activity.topic
  }
})
```

### 워커 처리

```typescript
// workers/evaluation.ts
evaluationQueue.process('evaluate-question', async (job) => {
  const { questionId, questionContent, context } = job.data

  // AI 평가 수행
  const result = await evaluateQuestion({
    question: questionContent,
    ...context
  })

  // 결과 저장
  await prisma.questionEvaluation.create({
    data: {
      questionId,
      activityId: context.activityId,
      ...result
    }
  })

  return result
})
```

## 환경 변수

```env
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o  # 또는 gpt-4-turbo

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929

# Redis (Queue)
REDIS_URL=redis://localhost:6379
```

## 비용 최적화

1. **캐싱**: 동일 질문에 대한 중복 평가 방지
2. **배치 처리**: 여러 질문을 한 번에 처리
3. **모델 선택**: 간단한 작업은 더 저렴한 모델 사용
4. **토큰 최적화**: 프롬프트 길이 최소화

## 에러 처리

```typescript
try {
  const result = await evaluateQuestion(context)
} catch (error) {
  if (error.code === 'rate_limit_exceeded') {
    // 재시도 로직 (Bull Queue가 자동 처리)
  } else if (error.code === 'context_length_exceeded') {
    // 입력 텍스트 축소
  } else {
    // 기본 에러 처리
  }
}
```

## Bloom's Taxonomy 레벨

| 레벨 | 설명 | 동사 예시 |
|------|------|----------|
| Remember | 기억, 회상 | 정의하다, 나열하다 |
| Understand | 이해, 설명 | 설명하다, 요약하다 |
| Apply | 적용, 활용 | 적용하다, 시연하다 |
| Analyze | 분석, 비교 | 분석하다, 비교하다 |
| Evaluate | 평가, 판단 | 평가하다, 비판하다 |
| Create | 창조, 설계 | 설계하다, 개발하다 |
