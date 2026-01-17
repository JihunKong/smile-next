---
id: questions-api
title: Questions API
category: api
lastUpdated: 2024-01-15
maintainedBy: ai-agent
version: 1.0.0
relatedDocs:
  - id: question-evaluation
    type: depends-on
  - id: ai-services
    type: depends-on
  - id: activities-api
    type: references
  - id: activities-components
    type: references
tags:
  - api
  - questions
  - ai
  - evaluation
---

# Questions API

## Overview

The Questions API handles question submission, retrieval, and AI-powered evaluation. Questions are submitted by students and automatically evaluated by AI services in the background.

## Related Documentation

### Depends On
- [Question Evaluation Feature](../features/question-evaluation.md) - Evaluation flow and logic
- [AI Services](../services/ai.md) - AI service implementation

### References
- [Activities API](./activities.md) - Questions belong to activities
- [Activity Components](../components/activities.md) - UI components using this API

## Base URL

```
/api/questions
```

## Endpoints

### POST /api/questions

**Description**: Submit a new question for evaluation

**Authentication**: Required (Student role)

**Request Body**:
```json
{
  "activityId": "string",
  "content": "string",
  "mode": "inquiry" | "exam" | "case",
  "topic": "string (optional)",
  "educationLevel": "elementary" | "middle-school" | "high-school" | "undergraduate"
}
```

**Response**:
- Success (201):
  ```json
  {
    "success": true,
    "question": {
      "id": "string",
      "content": "string",
      "activityId": "string",
      "creatorId": "string",
      "mode": "inquiry",
      "status": "pending",
      "createdAt": "2024-01-15T00:00:00Z"
    },
    "evaluationJobId": "string"
  }
  ```
- Error (400): Invalid request data
- Error (401): Unauthorized
- Error (404): Activity not found
- Error (500): Server error

**Example**:
```typescript
const response = await fetch('/api/questions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token',
  },
  body: JSON.stringify({
    activityId: 'activity-123',
    content: 'What is the impact of climate change on ocean ecosystems?',
    mode: 'inquiry',
    educationLevel: 'high-school',
  }),
});

const data = await response.json();
```

### GET /api/questions/:id

**Description**: Retrieve a question by ID

**Authentication**: Required

**Request**:
- Path Parameters:
  - `id` (string): Question ID

**Response**:
- Success (200):
  ```json
  {
    "question": {
      "id": "string",
      "content": "string",
      "activityId": "string",
      "creatorId": "string",
      "mode": "inquiry",
      "status": "evaluated",
      "evaluation": {
        "overallScore": 8.5,
        "bloomsLevel": "analyze",
        "evaluationText": "This question demonstrates...",
        "strengths": ["Clear topic", "Analytical approach"],
        "improvements": ["More specific scope"]
      },
      "createdAt": "2024-01-15T00:00:00Z",
      "updatedAt": "2024-01-15T00:00:00Z"
    }
  }
  ```
- Error (404): Question not found
- Error (403): Insufficient permissions

### GET /api/questions/activity/:activityId

**Description**: Get all questions for an activity

**Authentication**: Required

**Request**:
- Path Parameters:
  - `activityId` (string): Activity ID
- Query Parameters:
  - `status` (string, optional): Filter by status (pending, evaluating, evaluated, failed)
  - `mode` (string, optional): Filter by mode (inquiry, exam, case)
  - `limit` (number, optional): Results limit (default: 50)
  - `offset` (number, optional): Pagination offset

**Response**:
- Success (200):
  ```json
  {
    "questions": [
      {
        "id": "string",
        "content": "string",
        "status": "evaluated",
        "evaluation": {
          "overallScore": 8.5
        },
        "createdAt": "2024-01-15T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0
    }
  }
  ```

### GET /api/questions/:id/evaluation

**Description**: Get evaluation status and results

**Authentication**: Required

**Request**:
- Path Parameters:
  - `id` (string): Question ID

**Response**:
- Success (200):
  ```json
  {
    "status": "evaluated" | "pending" | "evaluating" | "failed",
    "evaluation": {
      "overallScore": 8.5,
      "bloomsLevel": "analyze",
      "bloomsConfidence": 0.85,
      "creativityScore": 7.0,
      "clarityScore": 9.0,
      "relevanceScore": 8.5,
      "innovationScore": 7.5,
      "evaluationText": "Detailed evaluation...",
      "strengths": ["Clear topic"],
      "improvements": ["More specific scope"],
      "enhancedQuestions": [
        "How does ocean acidification affect coral reefs?",
        "What are the long-term impacts of rising sea temperatures?"
      ]
    },
    "jobStatus": {
      "id": "job-id",
      "status": "completed",
      "progress": 100
    }
  }
  ```
- Pending (202): Evaluation in progress
- Error (404): Question not found

## Background Processing

Question evaluation is processed asynchronously:

1. Question is created and stored
2. Evaluation job is queued (Bull Queue)
3. AI service evaluates the question
4. Results are stored in database
5. Status is updated to "evaluated"

Poll the evaluation endpoint to check status:
```typescript
async function waitForEvaluation(questionId: string) {
  while (true) {
    const response = await fetch(`/api/questions/${questionId}/evaluation`);
    const data = await response.json();
    
    if (data.status === 'evaluated') {
      return data.evaluation;
    }
    
    if (data.status === 'failed') {
      throw new Error('Evaluation failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

## Error Handling

### Standard Errors

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific error details"
  }
}
```

### Error Codes

- `QUESTION_NOT_FOUND`: Question does not exist
- `ACTIVITY_NOT_FOUND`: Activity does not exist
- `EVALUATION_FAILED`: AI evaluation failed
- `INVALID_CONTENT`: Question content is invalid
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Rate Limiting

- Question submission: 10 requests/minute per user
- Question retrieval: 100 requests/minute per user
- Evaluation status: 30 requests/minute per user

## See Also

- [Question Evaluation Feature](../features/question-evaluation.md) - Evaluation flow
- [AI Services](../services/ai.md) - AI implementation
- [Queue Services](../services/queue.md) - Background processing
- [Activity Components](../components/activities.md) - UI components
- [Data Flow Architecture](../architecture/data-flow.md) - Request flow
