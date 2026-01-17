---
id: ai-services
title: AI Services
category: services
lastUpdated: 2024-01-15
maintainedBy: ai-agent
version: 1.0.0
relatedDocs:
  - id: question-evaluation
    type: references
  - id: questions-api
    type: references
  - id: queue-services
    type: depends-on
  - id: architecture-system
    type: depends-on
tags:
  - service
  - ai
  - openai
  - claude
---

# AI Services

## Overview

The AI Services module provides integration with OpenAI (GPT-4o) and Anthropic (Claude Sonnet 4.5) for question evaluation, Bloom's Taxonomy guidance, and educational feedback.

## Location

- `src/lib/ai/openai.ts` - OpenAI integration
- `src/lib/ai/claude.ts` - Anthropic Claude integration

## Related Documentation

### Depends On
- [Queue Services](./queue.md) - Background job processing
- [System Architecture](../architecture/system.md) - System design

### References
- [Question Evaluation Feature](../features/question-evaluation.md) - Evaluation flow
- [Questions API](../api/questions.md) - API endpoints using this service

## OpenAI Service

### evaluateQuestion(context)

Evaluates a student question using GPT-4o, providing quality scores, Bloom's Taxonomy classification, and improvement suggestions.

**Parameters**:
```typescript
interface EvaluateQuestionContext {
  question: string;
  activityName: string;
  groupName: string;
  educationLevel: 'elementary' | 'middle-school' | 'high-school' | 'undergraduate';
  subject: string;
  topic?: string;
}
```

**Returns**:
```typescript
interface QuestionEvaluation {
  overallScore: number;           // 0-10
  bloomsLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  bloomsConfidence: number;        // 0-1
  creativityScore: number;         // 0-10
  clarityScore: number;            // 0-10
  relevanceScore: number;          // 0-10
  innovationScore: number;         // 0-10
  evaluationText: string;
  strengths: string[];
  improvements: string[];
  enhancedQuestions: string[];     // 4 enhanced versions
}
```

**Example**:
```typescript
import { evaluateQuestion } from '@/lib/ai/openai';

const result = await evaluateQuestion({
  question: "What is the impact of climate change on ocean ecosystems?",
  activityName: "Environmental Science",
  groupName: "Science Class",
  educationLevel: "high-school",
  subject: "Science",
  topic: "Climate Change"
});

console.log(result.overallScore); // 8.5
console.log(result.bloomsLevel);  // "analyze"
```

**Error Handling**:
```typescript
try {
  const result = await evaluateQuestion(context);
} catch (error) {
  if (error.code === 'rate_limit_exceeded') {
    // Handle rate limiting
  } else if (error.code === 'context_length_exceeded') {
    // Handle context length
  } else {
    // General error handling
  }
}
```

### generateEnhancedQuestions(question, targetLevel, context)

Generates enhanced versions of a question targeting a specific Bloom's Taxonomy level.

**Parameters**:
- `question` (string): Original question
- `targetLevel` (string): Target Bloom's level
- `context` (object): Activity context

**Returns**: `string[]` - Array of enhanced questions

**Example**:
```typescript
import { generateEnhancedQuestions } from '@/lib/ai/openai';

const enhanced = await generateEnhancedQuestions(
  "What is photosynthesis?",
  "evaluate",
  {
    activityName: "Biology",
    subject: "Science",
    topic: "Plant Physiology"
  }
);
```

## Claude Service

### generateBloomsGuidance(question, currentLevel, context)

Provides Bloom's Taxonomy guidance and improvement suggestions for a question.

**Parameters**:
```typescript
interface BloomsGuidanceContext {
  subject: string;
  topic?: string;
  educationLevel: string;
}
```

**Returns**:
```typescript
interface BloomsGuidance {
  currentLevel: string;
  levelDescription: string;
  nextLevelSuggestions: string[];
  pedagogicalTips: string[];
  exampleQuestions: Array<{
    level: string;
    question: string;
  }>;
}
```

**Example**:
```typescript
import { generateBloomsGuidance } from '@/lib/ai/claude';

const guidance = await generateBloomsGuidance(
  "What is photosynthesis?",
  "remember",
  {
    subject: "Biology",
    topic: "Plants",
    educationLevel: "high-school"
  }
);
```

### provideExamCoaching(question, studentAnswer, correctAnswer, isCorrect)

Provides personalized coaching feedback for exam responses.

**Parameters**:
- `question` (string): Exam question
- `studentAnswer` (string): Student's answer
- `correctAnswer` (string): Correct answer
- `isCorrect` (boolean): Whether answer is correct

**Returns**:
```typescript
interface ExamCoaching {
  feedback: string;
  encouragement: string;
  nextSteps: string[];
  resources: string[];
}
```

**Example**:
```typescript
import { provideExamCoaching } from '@/lib/ai/claude';

const coaching = await provideExamCoaching(
  "What is the capital of South Korea?",
  "Busan",
  "Seoul",
  false
);
```

### generateCaseScenario(topic, context)

Generates educational case study scenarios.

**Parameters**:
```typescript
interface CaseScenarioContext {
  subject: string;
  educationLevel: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
}
```

**Returns**:
```typescript
interface CaseScenario {
  scenario: string;
  questions: string[];
  learningObjectives: string[];
}
```

## Dependencies

### Internal Dependencies
- `@/lib/queue/bull` - Queue processing for async evaluation
- `@/lib/db/prisma` - Database access for storing results

### External Dependencies
- `openai` (v6.15.0) - OpenAI SDK
- `@anthropic-ai/sdk` (v0.71.2) - Anthropic SDK

## Configuration

Environment variables:
```env
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
```

## Error Handling

### Rate Limiting
- Automatic retry with exponential backoff
- Queue-based processing to handle bursts
- Error logging and monitoring

### Context Length
- Input truncation for long questions
- Chunking for large contexts
- Error notification to user

### API Failures
- Retry logic (3 attempts)
- Fallback to alternative model
- Graceful degradation

## Performance Optimization

1. **Caching**: Cache evaluation results for similar questions
2. **Batch Processing**: Process multiple questions together when possible
3. **Model Selection**: Use appropriate model for task complexity
4. **Token Optimization**: Minimize prompt length while maintaining quality

## Cost Management

- Monitor API usage and costs
- Use appropriate models for each task
- Cache results to avoid duplicate calls
- Batch requests when possible

## See Also

- [Question Evaluation Feature](../features/question-evaluation.md) - How evaluation works
- [Queue Services](./queue.md) - Background processing
- [Questions API](../api/questions.md) - API integration
- [Performance Architecture](../architecture/performance.md) - Optimization strategies
