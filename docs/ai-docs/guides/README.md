# Guide Documentation

> **Category**: Guides  
> **Last Updated**: Auto-maintained by AI Agent  
> **Version**: 1.0.0

## Overview

This directory contains practical guides for development, testing, deployment, and troubleshooting.

## Guides

### Development
- [Development Guide](./development.md) - Development workflow and setup

### Testing
- [Testing Guide](./testing.md) - Testing strategies and practices

### Deployment
- [Deployment Guide](./deployment.md) - Deployment procedures and best practices

### Troubleshooting
- [Troubleshooting Guide](./troubleshooting.md) - Common issues and solutions

## Guide Documentation Template

All guide documentation follows this structure:

```markdown
---
id: guide-name
title: Guide Name
category: guides
lastUpdated: YYYY-MM-DD
maintainedBy: ai-agent
version: 1.0.0
relatedDocs:
  - id: development-guide
    type: see-also
  - id: architecture-name
    type: references
tags:
  - guide
  - how-to
---

# Guide Name

## Overview
Brief description of what this guide covers.

## Prerequisites
- Requirement 1
- Requirement 2

## Related Documentation
- [Related Guide](./other-guide.md) - Related information
- [Architecture](../architecture/name.md) - Architecture context

## Steps

### Step 1: [Action]
Description and instructions

### Step 2: [Action]
Description and instructions

## Common Issues

### Issue 1
**Problem**: Description
**Solution**: Solution steps

## Best Practices

1. Practice 1
2. Practice 2

## See Also
- [Related Guide](./other-guide.md)
- [Architecture Documentation](../architecture/name.md)
```

## Adding New Guide Documentation

1. Create file in `guides/` directory
2. Follow the template above
3. Add entry to this README
4. Update [INDEX.md](../INDEX.md)
5. Update [MAPPING.md](../MAPPING.md) with relationships
6. Add cross-references to related guides/architecture docs

---

*This directory is automatically maintained. See [RULES.md](../RULES.md) for maintenance guidelines.*
