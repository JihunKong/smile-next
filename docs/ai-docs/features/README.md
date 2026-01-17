# Feature Documentation

> **Category**: Features  
> **Last Updated**: Auto-maintained by AI Agent  
> **Version**: 1.0.0

## Overview

This directory contains documentation for all features and user-facing functionality in the SMILE platform. Each feature is documented with workflows, user stories, and technical implementation.

## Features

### Question Evaluation
- [Question Evaluation](./question-evaluation.md) - AI-powered question evaluation system

### Gamification
- [Gamification System](./gamification.md) - Points, badges, and leaderboard system

### Groups
- [Group Management](./groups.md) - Group creation, membership, and management

### Certificates
- [Certificate System](./certificates.md) - Certificate generation and management

## Feature Documentation Template

All feature documentation follows this structure:

```markdown
---
id: feature-name
title: Feature Name
category: features
lastUpdated: YYYY-MM-DD
maintainedBy: ai-agent
version: 1.0.0
relatedDocs:
  - id: service-name
    type: depends-on
  - id: api-endpoint
    type: references
  - id: component-name
    type: references
tags:
  - feature
  - user-facing
---

# Feature Name

## Overview
Brief description of the feature and its purpose.

## Related Documentation

### Depends On
- [Service Layer](../services/service-name.md) - Required services

### References
- [API Endpoint](../api/endpoint.md) - API integration
- [Component](../components/component-name.md) - UI components

## User Stories

- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]

## Workflow

### Step 1: [Action]
Description of what happens

### Step 2: [Action]
Description of what happens

## Technical Implementation

### Data Flow
```
User Action → API → Service → Database
                ↓
            Background Job
                ↓
            AI Processing
                ↓
            Result Storage
```

### Key Components
- Component 1: Purpose
- Component 2: Purpose

## Configuration

Feature-specific configuration:
```env
FEATURE_ENABLED=true
FEATURE_SETTING=value
```

## See Also
- [Service Implementation](../services/service-name.md)
- [API Documentation](../api/endpoint.md)
- [Component Documentation](../components/component-name.md)
```

## Adding New Feature Documentation

1. Create file in `features/` directory
2. Follow the template above
3. Add entry to this README
4. Update [INDEX.md](../INDEX.md)
5. Update [MAPPING.md](../MAPPING.md) with relationships
6. Add cross-references to related service/API/component docs

---

*This directory is automatically maintained. See [RULES.md](../RULES.md) for maintenance guidelines.*
