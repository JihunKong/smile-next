# Component Documentation

> **Category**: Components  
> **Last Updated**: Auto-maintained by AI Agent  
> **Version**: 1.0.0

## Overview

This directory contains documentation for all React components in the SMILE platform. Each component is documented with props, usage examples, and integration details.

## Component Categories

### Activities
- [Activity Components](./activities.md) - Activity-related UI components

### Gamification
- [Gamification Components](./gamification.md) - Badges, points, leaderboard components

### Groups
- [Group Components](./groups.md) - Group management UI

### UI
- [UI Components](./ui.md) - Base UI components and utilities

## Component Documentation Template

All component documentation follows this structure:

```markdown
---
id: component-name
title: Component Name
category: components
lastUpdated: YYYY-MM-DD
maintainedBy: ai-agent
version: 1.0.0
relatedDocs:
  - id: api-endpoint
    type: depends-on
  - id: feature-name
    type: references
tags:
  - component
  - ui
---

# Component Name

## Overview
Brief description of the component's purpose.

## Location
`src/components/path/ComponentName.tsx`

## Related Documentation
- [API Endpoint](../api/endpoint.md) - Data source
- [Feature](../features/feature.md) - Feature context

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `propName` | `Type` | Yes | - | Description |

## Usage

```tsx
import { ComponentName } from '@/components/path/ComponentName';

<ComponentName
  prop="value"
  optionalProp={123}
/>
```

## Examples

### Basic Usage
[Example code]

### Advanced Usage
[Example code]

## Implementation Details

### Server vs Client Component
- Server Component (default)
- Client Component (`'use client'`)

### Data Fetching
- Server-side data fetching
- Client-side data fetching

### State Management
- Local state
- Server state

## Styling

- Tailwind CSS classes
- Custom styles
- Responsive design

## Accessibility

- ARIA attributes
- Keyboard navigation
- Screen reader support

## See Also
- [API Endpoint](../api/endpoint.md)
- [Feature Documentation](../features/feature.md)
- [UI Components](./ui.md)
```

## Adding New Component Documentation

1. Create file in `components/` directory
2. Follow the template above
3. Add entry to this README
4. Update [INDEX.md](../INDEX.md)
5. Update [MAPPING.md](../MAPPING.md) with relationships
6. Add cross-references to related API/feature docs

---

*This directory is automatically maintained. See [RULES.md](../RULES.md) for maintenance guidelines.*
