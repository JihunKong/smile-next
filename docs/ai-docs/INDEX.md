# AI-Driven Documentation Index

> **Last Updated**: Auto-maintained by AI Agent  
> **Version**: 1.0.0  
> **Maintenance**: Automated via AI rules in [RULES.md](./RULES.md)

## Overview

This documentation system is fully maintained by AI automation. All documents follow a consistent structure and are cross-referenced for mapping consistency.

## Documentation Structure

```
docs/ai-docs/
├── INDEX.md              # This file - Central registry
├── RULES.md              # AI maintenance rules and guidelines
├── MAPPING.md            # Cross-reference mapping system
├── api/                  # API endpoint documentation
├── components/           # React component documentation
├── services/             # Service layer documentation
├── features/             # Feature-specific documentation
├── architecture/         # Architecture and design docs
└── guides/               # Development and operational guides
```

## Quick Navigation

### Core Documentation
- [AI Maintenance Rules](./RULES.md) - How AI agents maintain this documentation
- [Cross-Reference Mapping](./MAPPING.md) - Document relationships and dependencies
- [AI Agent Memory](./AI_AGENT_MEMORY.md) - Quick reference for AI agents
- [Project Backlog](./backlog/README.md) - AI-managed bugs, features, and tech debt tracker

### API Documentation
- [API Overview](./api/README.md) - All API endpoints
- [Authentication API](./api/auth.md) - Auth endpoints
- [Activities API](./api/activities.md) - Activity management
- [Questions API](./api/questions.md) - Question handling
- [Groups API](./api/groups.md) - Group management
- [AI Services API](./api/ai-services.md) - AI integration endpoints

### Component Documentation
- [Components Overview](./components/README.md) - All React components
- [Activity Components](./components/activities.md) - Activity-related components
- [Gamification Components](./components/gamification.md) - Badges, points, leaderboard
- [UI Components](./components/ui.md) - Base UI components

### Service Documentation
- [Services Overview](./services/README.md) - All service layers
- [AI Services](./services/ai.md) - OpenAI and Claude integration
- [Database Services](./services/database.md) - Prisma and data access
- [Queue Services](./services/queue.md) - Bull Queue background jobs
- [Auth Services](./services/auth.md) - Authentication and authorization

### Feature Documentation
- [Features Overview](./features/README.md) - All features
- [Question Evaluation](./features/question-evaluation.md) - AI-powered question evaluation
- [Gamification System](./features/gamification.md) - Points, badges, leaderboard
- [Group Management](./features/groups.md) - Group creation and management
- [Certificate System](./features/certificates.md) - Certificate generation

### Architecture Documentation
- [System Architecture](./architecture/system.md) - Overall system design
- [Data Flow](./architecture/data-flow.md) - Request/response flows
- [Security Architecture](./architecture/security.md) - Security patterns
- [Performance Optimization](./architecture/performance.md) - Optimization strategies

### Guides
- [Frontend Conventions](./guides/frontend-conventions.md) - **Essential patterns to prevent common UX bugs**
- [Development Guide](./guides/development.md) - Development workflow
- [Testing Guide](./guides/testing.md) - Testing strategies
- [Deployment Guide](./guides/deployment.md) - General deployment procedures
- [CI/CD Overview](./guides/cicd-deployment.md) - Pipeline overview with Mermaid diagrams
- [GitHub Actions](./guides/github-actions.md) - Workflow configuration and details
- [Docker Configuration](./guides/docker-configuration.md) - Docker Compose and Dockerfile setup
- [VM Setup Guide](./guides/vm-setup.md) - First-time environment setup
- [Troubleshooting Guide](./guides/troubleshooting.md) - General troubleshooting
- [Deployment Troubleshooting](./guides/deployment-troubleshooting.md) - CI/CD and deployment issues

## Document Metadata

Each document in this system includes:

```yaml
---
id: unique-document-id
title: Document Title
category: api|components|services|features|architecture|guides
lastUpdated: YYYY-MM-DD
maintainedBy: ai-agent
version: 1.0.0
relatedDocs:
  - id: related-doc-id
    type: depends-on|references|see-also
tags:
  - tag1
  - tag2
---
```

## Cross-Reference System

All documents use consistent cross-references:
- `[Document Title](./path/to/doc.md)` - Direct links
- `[Document Title](./path/to/doc.md#section)` - Section links
- `@ref:document-id` - Reference by ID (processed by AI)

See [MAPPING.md](./MAPPING.md) for the complete reference graph.

## Maintenance Rules

AI agents maintaining this documentation must follow:
1. [RULES.md](./RULES.md) - Core maintenance rules
2. Update INDEX.md when adding/removing documents
3. Update MAPPING.md when creating cross-references
4. Maintain consistent metadata in all documents
5. Verify all links are valid

## Adding New Documentation

When adding new documentation:

1. **Create the document** in the appropriate category folder
2. **Add metadata** at the top (YAML frontmatter)
3. **Update INDEX.md** with the new document entry
4. **Update MAPPING.md** with cross-references
5. **Follow the template** for that document type
6. **Add cross-references** to related documents

## Document Status

| Category | Count | Last Updated | Status |
|----------|-------|--------------|--------|
| Core | 4 | Auto | ✅ Maintained |
| API | 6 | Auto | ✅ Maintained |
| Components | 4 | Auto | ✅ Maintained |
| Services | 4 | Auto | ✅ Maintained |
| Features | 5 | Auto | ✅ Maintained |
| Architecture | 4 | Auto | ✅ Maintained |
| Guides | 4 | Auto | ✅ Maintained |
| Management | 1 | Auto | ✅ Maintained |

## AI Agent Instructions

When modifying documentation:

1. **Read RULES.md first** - Understand maintenance guidelines
2. **Check MAPPING.md** - Understand document relationships
3. **Update INDEX.md** - Keep registry current
4. **Maintain consistency** - Follow templates and patterns
5. **Verify links** - Ensure all references are valid
6. **Update metadata** - Keep lastUpdated and version current

---

*This index is automatically maintained. Manual edits may be overwritten by AI agents.*
