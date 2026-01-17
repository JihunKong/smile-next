---
id: question-evaluation
title: Question Evaluation System
category: features
lastUpdated: 2024-01-15
maintainedBy: ai-agent
version: 1.2.0
relatedDocs:
  - id: ai-services
    type: depends-on
  - id: queue-services
    type: depends-on
  - id: questions-api
    type: references
  - id: activities-components
    type: references
  - id: gamification
    type: see-also
tags:
  - feature
  - ai
  - questions
  - evaluation
---

# Question Evaluation System

## Overview

The Question Evaluation System uses AI (OpenAI GPT-4o) to automatically analyze student-submitted questions, providing quality scores, Bloom's Taxonomy classification, and personalized feedback. Evaluations are processed asynchronously via background jobs.

## Related Documentation

### Depends On
- [AI Services](../services/ai.md) - Required: AI service implementation
- [Queue Services](../services/queue.md) - Required: Background job processing

### References
- [Questions API](../api/questions.md) - API endpoints for question submission
- [Activity Components](../components/activities.md) - UI components displaying evaluations

### See Also
- [Gamification System](./gamification.md) - Points and badges from evaluations
- [Data Flow Architecture](../architecture/data-flow.md) - Evaluation flow diagram

## User Stories

- As a **student**, I want my questions evaluated automatically so that I can improve my questioning skills
- As a **student**, I want to see detailed feedback so that I understand how to ask better questions
- As a **teacher**, I want to see question quality metrics so that I can track student progress
- As a **student**, I want enhanced question suggestions so that I can explore deeper topics

## Workflow

### Step 1: Question Submission
1. Student submits a question via the activity page
2. Question is validated and stored in database
3. Status is set to "pending"

### Step 2: Evaluation Queue
1. Evaluation job is added to Bull Queue
2. Job includes question content and context (activity, group, education level)
3. Job is processed by background worker

### Step 3: AI Evaluation
1. Worker calls OpenAI API with question and context
2. AI analyzes question quality, Bloom's level, and provides feedback
3. Evaluation results are generated

### Step 4: Result Storage
1. Evaluation results are stored in database
2. Question status is updated to "evaluated"
3. Points are calculated and awarded (if applicable)

### Step 5: UI Update
1. Client polls evaluation status endpoint
2. When evaluation completes, UI displays results
3. Student sees scores, feedback, and enhanced questions

## Technical Implementation

### Data Flow

```
Student submits question
    ↓
POST /api/questions
    ↓
Question stored (status: "pending")
    ↓
Evaluation job queued (Bull Queue)
    ↓
Background worker processes job
    ↓
OpenAI API call (evaluateQuestion)
    ↓
Results stored in database
    ↓
Question status: "evaluated"
    ↓
Client polls /api/questions/:id/evaluation
    ↓
UI displays evaluation results
```

### Key Components

#### API Layer
- `POST /api/questions` - Question submission
- `GET /api/questions/:id/evaluation` - Evaluation status and results

#### Service Layer
- `evaluateQuestion()` - OpenAI integration
- `queueQuestionEvaluation()` - Queue job creation

#### Queue Processing
- `evaluationQueue` - Bull Queue for evaluations
- Worker processes jobs asynchronously

#### Database Models
- `Question` - Question storage
- `QuestionEvaluation` - Evaluation results

### Evaluation Metrics

The system evaluates questions on multiple dimensions:

1. **Overall Score** (0-10): Composite quality score
2. **Bloom's Taxonomy Level**: remember, understand, apply, analyze, evaluate, create
3. **Creativity Score** (0-10): Originality and innovation
4. **Clarity Score** (0-10): Question clarity and precision
5. **Relevance Score** (0-10): Relevance to activity topic
6. **Innovation Score** (0-10): Novel approach or perspective

### Feedback Components

- **Evaluation Text**: Detailed analysis of the question
- **Strengths**: What the question does well
- **Improvements**: Suggestions for enhancement
- **Enhanced Questions**: 4 improved versions targeting higher Bloom's levels

## Configuration

Feature-specific environment variables:
```env
# AI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Queue Configuration
REDIS_URL=redis://localhost:6379

# Evaluation Settings
EVALUATION_TIMEOUT=30000  # 30 seconds
EVALUATION_RETRY_ATTEMPTS=3
```

## Error Handling

### Evaluation Failures
- Automatic retry (3 attempts with exponential backoff)
- Status set to "failed" if all retries fail
- Error logged for monitoring

### Rate Limiting
- Queue-based processing prevents API rate limits
- Jobs are processed sequentially per user
- Rate limit errors trigger automatic retry

### Timeout Handling
- 30-second timeout for AI evaluation
- Timeout triggers retry with backoff
- User notified if evaluation fails

## Performance Considerations

1. **Asynchronous Processing**: Evaluations don't block user requests
2. **Queue Management**: Jobs are prioritized and processed efficiently
3. **Caching**: Similar questions may use cached evaluations
4. **Batch Processing**: Multiple evaluations can be batched when possible

## Integration Points

### Gamification
- Points awarded based on evaluation scores
- Badges unlocked for high-quality questions
- Leaderboard rankings updated

### Activity System
- Questions linked to activities
- Activity statistics include evaluation metrics
- Group-level evaluation summaries

## See Also

- [AI Services](../services/ai.md) - AI implementation details
- [Queue Services](../services/queue.md) - Background job processing
- [Questions API](../api/questions.md) - API endpoints
- [Activity Components](../components/activities.md) - UI components
- [Gamification System](./gamification.md) - Points and rewards
- [Data Flow Architecture](../architecture/data-flow.md) - System flow
