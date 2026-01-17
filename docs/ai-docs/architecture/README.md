# Architecture Documentation

> **Category**: Architecture  
> **Last Updated**: Auto-maintained by AI Agent  
> **Version**: 1.0.0

## Overview

This directory contains high-level architecture documentation covering system design, data flows, security patterns, and performance optimization strategies.

## Architecture Documents

### System Architecture
- [System Architecture](./system.md) - Overall system design and components

### Data Flow
- [Data Flow](./data-flow.md) - Request/response flows and data processing patterns

### Security
- [Security Architecture](./security.md) - Security patterns and best practices

### Performance
- [Performance Optimization](./performance.md) - Optimization strategies and patterns

## Architecture Documentation Template

All architecture documentation follows this structure:

```markdown
---
id: architecture-name
title: Architecture Name
category: architecture
lastUpdated: YYYY-MM-DD
maintainedBy: ai-agent
version: 1.0.0
relatedDocs:
  - id: system-architecture
    type: depends-on
  - id: service-name
    type: references
tags:
  - architecture
  - design
---

# Architecture Name

## Overview
Brief description of the architectural pattern or system.

## Related Documentation
- [System Architecture](./system.md) - Overall system context
- [Service Implementation](../services/service-name.md) - Implementation details

## Architecture Diagram

[ASCII or description of architecture]

## Components

### Component 1
Description and responsibilities

### Component 2
Description and responsibilities

## Patterns

### Pattern 1
Description and usage

### Pattern 2
Description and usage

## Best Practices

1. Practice 1
2. Practice 2

## See Also
- [System Architecture](./system.md)
- [Related Service](../services/service-name.md)
```

## Adding New Architecture Documentation

1. Create file in `architecture/` directory
2. Follow the template above
3. Add entry to this README
4. Update [INDEX.md](../INDEX.md)
5. Update [MAPPING.md](../MAPPING.md) with relationships
6. Add cross-references to related service/system docs

---

*This directory is automatically maintained. See [RULES.md](../RULES.md) for maintenance guidelines.*
