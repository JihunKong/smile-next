# API Documentation

> **Category**: API  
> **Last Updated**: Auto-maintained by AI Agent  
> **Version**: 1.0.0

## Overview

This directory contains documentation for all API endpoints in the SMILE platform. Each API route is documented with request/response schemas, authentication requirements, and examples.

## API Endpoints

### Authentication
- [Authentication API](./auth.md) - User authentication and session management

### Activities
- [Activities API](./activities.md) - Activity creation, management, and retrieval

### Questions
- [Questions API](./questions.md) - Question submission and evaluation

### Groups
- [Groups API](./groups.md) - Group management and membership

### AI Services
- [AI Services API](./ai-services.md) - AI evaluation and processing endpoints

### Leaderboard
- [Leaderboard API](./leaderboard.md) - Rankings and leaderboard data

### Certificates
- [Certificates API](./certificates.md) - Certificate generation and management

## API Documentation Template

All API documentation follows this structure:

```markdown
---
id: api-endpoint-name
title: API Endpoint Name
category: api
lastUpdated: YYYY-MM-DD
maintainedBy: ai-agent
version: 1.0.0
relatedDocs:
  - id: service-name
    type: depends-on
  - id: component-name
    type: references
tags:
  - api
  - endpoint
---

# API Endpoint Name

## Overview
Brief description of the endpoint's purpose.

## Related Documentation
- [Service Layer](../services/service-name.md) - Implementation details
- [Component](../components/component-name.md) - UI component using this API

## Base URL
```
/api/endpoint-name
```

## Endpoints

### GET /api/endpoint-name
**Description**: Brief description

**Authentication**: Required/Optional

**Request**:
- Query Parameters:
  - `param` (type): Description
- Body: (if applicable)
  ```json
  {
    "field": "value"
  }
  ```

**Response**:
- Success (200):
  ```json
  {
    "data": {}
  }
  ```
- Error Cases:
  - 400: Bad Request
  - 401: Unauthorized
  - 404: Not Found
  - 500: Internal Server Error

**Example**:
```typescript
const response = await fetch('/api/endpoint-name', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Error Handling

All endpoints follow standard error response format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Rate Limiting

- Standard endpoints: 100 requests/minute
- AI endpoints: 10 requests/minute
- Auth endpoints: 20 requests/minute

## See Also
- [Service Implementation](../services/service-name.md)
- [Component Usage](../components/component-name.md)
- [Architecture](../architecture/data-flow.md)
```

## Adding New API Documentation

1. Create file in `api/` directory
2. Follow the template above
3. Add entry to this README
4. Update [INDEX.md](../INDEX.md)
5. Update [MAPPING.md](../MAPPING.md) with relationships
6. Add cross-references to related service/component docs

---

*This directory is automatically maintained. See [RULES.md](../RULES.md) for maintenance guidelines.*
