# Documentation Cross-Reference Mapping

> **Purpose**: Map all document relationships and dependencies  
> **Last Updated**: Auto-maintained by AI Agent  
> **Version**: 1.0.0

## Overview

This document maintains a complete graph of all documentation relationships. AI agents use this to:
- Understand document dependencies
- Maintain cross-reference consistency
- Identify affected documents when updating
- Ensure bidirectional references where appropriate

## Reference Types

- **depends-on**: Document A requires Document B to understand (one-way)
- **references**: Document A mentions/uses Document B (one-way)
- **see-also**: Related but not required (bidirectional)
- **replaces**: Document A replaces deprecated Document B

## Document Graph

### API Documentation

#### Authentication API (`api/auth.md`)
- **depends-on**:
  - `services/auth.md` - Auth service implementation
  - `architecture/security.md` - Security patterns
- **references**:
  - `components/auth.md` - Auth UI components
- **see-also**:
  - `features/groups.md` - Group permissions
  - `guides/development.md` - Development setup

#### Activities API (`api/activities.md`)
- **depends-on**:
  - `services/activities.md` - Activity service
  - `services/database.md` - Database access
- **references**:
  - `components/activities.md` - Activity components
  - `features/question-evaluation.md` - Question evaluation
- **see-also**:
  - `api/questions.md` - Question endpoints
  - `api/groups.md` - Group management

#### Questions API (`api/questions.md`)
- **depends-on**:
  - `services/ai.md` - AI evaluation service
  - `services/queue.md` - Background job processing
- **references**:
  - `features/question-evaluation.md` - Evaluation flow
  - `components/activities.md` - Question UI
- **see-also**:
  - `api/activities.md` - Activity endpoints
  - `services/ai.md` - AI services

#### Groups API (`api/groups.md`)
- **depends-on**:
  - `services/database.md` - Database access
  - `services/auth.md` - Permission checking
- **references**:
  - `features/groups.md` - Group features
  - `components/groups.md` - Group components
- **see-also**:
  - `api/auth.md` - Authentication
  - `features/gamification.md` - Group leaderboards

#### AI Services API (`api/ai-services.md`)
- **depends-on**:
  - `services/ai.md` - AI service implementation
  - `services/queue.md` - Queue processing
- **references**:
  - `features/question-evaluation.md` - Evaluation features
- **see-also**:
  - `architecture/performance.md` - Performance optimization
  - `guides/troubleshooting.md` - Error handling

### Component Documentation

#### Activity Components (`components/activities.md`)
- **depends-on**:
  - `api/activities.md` - API endpoints
  - `api/questions.md` - Question endpoints
- **references**:
  - `features/question-evaluation.md` - Evaluation UI
  - `components/ui.md` - Base UI components
- **see-also**:
  - `components/gamification.md` - Gamification UI
  - `architecture/data-flow.md` - Data flow patterns

#### Gamification Components (`components/gamification.md`)
- **depends-on**:
  - `features/gamification.md` - Gamification system
  - `api/leaderboard.md` - Leaderboard API
- **references**:
  - `components/ui.md` - Base components
- **see-also**:
  - `features/groups.md` - Group rankings
  - `architecture/performance.md` - Performance

#### UI Components (`components/ui.md`)
- **references**:
  - All component docs (used by all)
- **see-also**:
  - `guides/development.md` - Development patterns

### Service Documentation

#### AI Services (`services/ai.md`)
- **depends-on**:
  - `architecture/system.md` - System architecture
- **references**:
  - `services/queue.md` - Background processing
  - `features/question-evaluation.md` - Evaluation features
- **see-also**:
  - `api/ai-services.md` - API endpoints
  - `architecture/performance.md` - Optimization

#### Database Services (`services/database.md`)
- **depends-on**:
  - `architecture/system.md` - System architecture
- **references**:
  - All API docs (used by all)
  - All service docs (used by all)
- **see-also**:
  - `architecture/data-flow.md` - Data flow
  - `guides/troubleshooting.md` - Database issues

#### Queue Services (`services/queue.md`)
- **depends-on**:
  - `architecture/system.md` - System architecture
- **references**:
  - `services/ai.md` - AI processing
  - `features/question-evaluation.md` - Evaluation jobs
- **see-also**:
  - `architecture/performance.md` - Performance
  - `guides/troubleshooting.md` - Queue issues

#### Auth Services (`services/auth.md`)
- **depends-on**:
  - `architecture/security.md` - Security patterns
- **references**:
  - `api/auth.md` - Auth endpoints
  - `features/groups.md` - Permissions
- **see-also**:
  - `components/auth.md` - Auth UI
  - `guides/development.md` - Auth setup

### Feature Documentation

#### Question Evaluation (`features/question-evaluation.md`)
- **depends-on**:
  - `services/ai.md` - AI services
  - `services/queue.md` - Queue processing
- **references**:
  - `api/questions.md` - Question API
  - `components/activities.md` - Question UI
- **see-also**:
  - `features/gamification.md` - Points and badges
  - `architecture/data-flow.md` - Evaluation flow

#### Gamification System (`features/gamification.md`)
- **depends-on**:
  - `services/database.md` - Data storage
- **references**:
  - `components/gamification.md` - UI components
  - `api/leaderboard.md` - Leaderboard API
- **see-also**:
  - `features/groups.md` - Group rankings
  - `features/question-evaluation.md` - Points from evaluation

#### Group Management (`features/groups.md`)
- **depends-on**:
  - `services/auth.md` - Permissions
  - `services/database.md` - Data storage
- **references**:
  - `api/groups.md` - Group API
  - `components/groups.md` - Group UI
- **see-also**:
  - `features/gamification.md` - Group leaderboards
  - `api/auth.md` - Authentication

#### Certificate System (`features/certificates.md`)
- **depends-on**:
  - `services/database.md` - Data storage
- **references**:
  - `api/certificates.md` - Certificate API
  - `components/certificates.md` - Certificate UI
- **see-also**:
  - `features/gamification.md` - Achievement system
  - `architecture/performance.md` - PDF generation

### Architecture Documentation

#### System Architecture (`architecture/system.md`)
- **references**:
  - All service docs (system components)
  - All feature docs (system features)
- **see-also**:
  - `architecture/data-flow.md` - Data flows
  - `architecture/security.md` - Security
  - `architecture/performance.md` - Performance

#### Data Flow (`architecture/data-flow.md`)
- **depends-on**:
  - `architecture/system.md` - System overview
- **references**:
  - All API docs (request flows)
  - All service docs (processing flows)
- **see-also**:
  - `features/question-evaluation.md` - Evaluation flow
  - `architecture/performance.md` - Optimization

#### Security Architecture (`architecture/security.md`)
- **depends-on**:
  - `architecture/system.md` - System overview
- **references**:
  - `services/auth.md` - Authentication
  - `api/auth.md` - Auth endpoints
- **see-also**:
  - `features/groups.md` - Permissions
  - `guides/troubleshooting.md` - Security issues

#### Performance Optimization (`architecture/performance.md`)
- **depends-on**:
  - `architecture/system.md` - System overview
- **references**:
  - `services/queue.md` - Background processing
  - `services/ai.md` - AI optimization
- **see-also**:
  - `architecture/data-flow.md` - Flow optimization
  - `guides/troubleshooting.md` - Performance issues

### Guide Documentation

#### Development Guide (`guides/development.md`)
- **references**:
  - All API docs (API usage)
  - All component docs (component usage)
  - `architecture/system.md` - System overview
- **see-also**:
  - `guides/testing.md` - Testing
  - `guides/deployment.md` - Deployment

#### Testing Guide (`guides/testing.md`)
- **depends-on**:
  - `guides/development.md` - Development setup
- **references**:
  - All API docs (API testing)
  - All component docs (Component testing)
- **see-also**:
  - `guides/troubleshooting.md` - Common issues

#### Deployment Guide (`guides/deployment.md`)
- **depends-on**:
  - `architecture/system.md` - System architecture
- **references**:
  - `guides/development.md` - Development setup
- **see-also**:
  - `architecture/performance.md` - Production optimization
  - `guides/troubleshooting.md` - Deployment issues

#### Troubleshooting Guide (`guides/troubleshooting.md`)
- **references**:
  - All service docs (service issues)
  - All API docs (API issues)
  - All architecture docs (system issues)
- **see-also**:
  - All guide docs (related guides)

## Dependency Graph

```
API Docs
  ├── depends-on → Service Docs
  ├── depends-on → Architecture Docs
  └── references → Component Docs

Component Docs
  ├── depends-on → API Docs
  └── references → Feature Docs

Service Docs
  ├── depends-on → Architecture Docs
  └── references → Feature Docs

Feature Docs
  ├── depends-on → Service Docs
  └── references → API Docs

Architecture Docs
  └── references → All other docs

Guide Docs
  └── references → All other docs
```

## Maintenance Rules

### When Adding a Document

1. Add entry to appropriate section above
2. List all dependencies (depends-on)
3. List all references
4. List see-also relationships
5. Update reverse references in target documents

### When Removing a Document

1. Remove entry from this file
2. Remove all references from other documents
3. Update INDEX.md to mark as removed
4. If replaced, add "replaces" relationship

### When Updating Relationships

1. Update this file first
2. Update source document's frontmatter
3. Update target document's frontmatter (for bidirectional)
4. Verify all links are valid

## Validation

AI agents should validate:
- All documents in INDEX.md have entries here
- All depends-on relationships are valid
- All references point to existing documents
- Bidirectional see-also relationships are symmetric
- No circular dependencies in depends-on chain

## Change Log

| Date | Change | Affected Docs |
|------|--------|---------------|
| 2024-01-15 | Initial mapping | All |
| Auto | Auto-updated | - |

---

*This mapping is automatically maintained. Manual edits may be overwritten by AI agents.*
