# AI Documentation Maintenance Rules

> **Purpose**: Guidelines for AI agents maintaining the documentation system  
> **Version**: 1.0.0  
> **Applies To**: All AI agents modifying documentation

## Core Principles

### 1. Consistency First
- All documents must follow the same structure
- Use consistent terminology across all docs
- Maintain uniform formatting and style

### 2. Cross-Reference Integrity
- Every document must link to related documents
- Broken links are not allowed
- Update MAPPING.md when adding/removing references

### 3. Metadata Maintenance
- All documents must have YAML frontmatter
- Update `lastUpdated` when modifying content
- Increment `version` for breaking changes

### 4. Automated Updates
- AI agents should update INDEX.md automatically
- Maintain document status tables
- Keep cross-reference mappings current

## Document Structure Rules

### Required Sections

Every document must include:

```markdown
---
id: unique-identifier
title: Document Title
category: api|components|services|features|architecture|guides
lastUpdated: YYYY-MM-DD
maintainedBy: ai-agent
version: 1.0.0
relatedDocs:
  - id: doc-id
    type: depends-on|references|see-also
tags:
  - relevant-tag
---

# Document Title

## Overview
Brief description of what this document covers.

## Related Documentation
- [Related Doc 1](./path/to/doc1.md) - Description
- [Related Doc 2](./path/to/doc2.md) - Description

## [Main Content Sections]

## See Also
- [Additional Reference](./path/to/doc.md)
```

### File Naming Conventions

- Use kebab-case: `question-evaluation.md`
- Be descriptive: `ai-services.md` not `ai.md`
- Group related docs: `api/auth.md`, `api/activities.md`

### Category-Specific Rules

#### API Documentation
```markdown
## Endpoint: GET /api/resource

**Description**: Brief description

**Authentication**: Required/Optional

**Request**:
- Query Parameters
- Body Schema

**Response**:
- Success (200)
- Error Cases

**Related**:
- [Service Layer](./services/resource.md)
- [Component](./components/resource.md)
```

#### Component Documentation
```markdown
## ComponentName

**Location**: `src/components/path/ComponentName.tsx`

**Purpose**: What this component does

**Props**:
- `propName` (type): Description

**Usage**:
```tsx
<ComponentName prop="value" />
```

**Related**:
- [API Endpoint](./api/resource.md)
- [Service](./services/resource.md)
```

#### Service Documentation
```markdown
## ServiceName

**Location**: `src/lib/services/service-name.ts`

**Purpose**: Service description

**Functions**:
- `functionName(params)`: Description

**Dependencies**:
- Prisma
- External Service

**Related**:
- [API Route](./api/resource.md)
- [Component](./components/resource.md)
```

## Cross-Reference Rules

### Reference Types

1. **depends-on**: Document A requires Document B to understand
2. **references**: Document A mentions/uses Document B
3. **see-also**: Related but not required reading

### Reference Format

```markdown
## Related Documentation

### Depends On
- [Required Doc](./path/to/doc.md) - Why it's required

### References
- [Referenced Doc](./path/to/doc.md) - How it's used

### See Also
- [Related Doc](./path/to/doc.md) - Additional context
```

### Updating MAPPING.md

When adding a cross-reference:

1. Add entry to source document's `relatedDocs` in frontmatter
2. Add entry to MAPPING.md in appropriate section
3. Add reverse reference in target document's frontmatter

## Content Update Rules

### When to Update Documentation

1. **Code Changes**: When code is modified, update relevant docs
2. **New Features**: Create new documentation for new features
3. **API Changes**: Update API docs when endpoints change
4. **Architecture Changes**: Update architecture docs for system changes
5. **Bug Fixes**: Update troubleshooting guides if relevant

### Update Process

1. **Identify Affected Docs**: Check MAPPING.md for dependencies
2. **Update Content**: Modify relevant sections
3. **Update Metadata**: Change `lastUpdated` date
4. **Update Cross-References**: Add/remove links as needed
5. **Update INDEX.md**: Update status if needed
6. **Update MAPPING.md**: Reflect new relationships

### Version Management

- **Patch (1.0.1)**: Minor corrections, typos
- **Minor (1.1.0)**: New sections, additional content
- **Major (2.0.0)**: Structural changes, breaking changes

## Link Validation Rules

### Internal Links
- Must use relative paths: `./path/to/doc.md`
- Must include file extension: `.md`
- Must be valid (file exists)

### Section Links
- Use anchors: `./doc.md#section-name`
- Verify section exists in target document
- Use consistent heading IDs

### External Links
- Mark clearly: `[External Resource](https://...)`
- Verify links are accessible
- Note if link requires authentication

## Metadata Rules

### Required Fields

```yaml
id: unique-identifier          # kebab-case, unique
title: Document Title          # Human-readable title
category: api                  # One of: api, components, services, features, architecture, guides
lastUpdated: YYYY-MM-DD        # ISO date format
maintainedBy: ai-agent         # Always "ai-agent" for auto-maintained docs
version: 1.0.0                 # Semantic versioning
```

### Optional Fields

```yaml
relatedDocs:                   # Array of related documents
  - id: doc-id
    type: depends-on
tags:                          # Array of tags
  - tag1
  - tag2
deprecated: false              # Set to true if deprecated
replacedBy: new-doc-id         # If deprecated, link to replacement
```

## AI Agent Workflow

### Before Making Changes

1. Read this file (RULES.md)
2. Read MAPPING.md to understand relationships
3. Read INDEX.md to see current structure
4. Identify all affected documents

### During Changes

1. Follow document structure rules
2. Maintain cross-reference consistency
3. Update metadata appropriately
4. Use consistent terminology

### After Making Changes

1. Update INDEX.md if structure changed
2. Update MAPPING.md if relationships changed
3. Verify all links are valid
4. Check metadata is complete
5. Ensure formatting is consistent

## Quality Checks

### Before Committing Documentation

- [ ] All required sections present
- [ ] Metadata is complete and valid
- [ ] All links are valid (internal and external)
- [ ] Cross-references are bidirectional where appropriate
- [ ] INDEX.md is updated
- [ ] MAPPING.md is updated
- [ ] Terminology is consistent
- [ ] Code examples are accurate
- [ ] Version numbers are appropriate

### Automated Validation

AI agents should validate:
- YAML frontmatter syntax
- Link existence
- Cross-reference consistency
- Metadata completeness
- Document structure compliance

## Exception Handling

### When Rules Conflict

1. **Consistency over rules**: If a rule conflicts with existing patterns, maintain consistency
2. **User clarity over structure**: If structure conflicts with clarity, prioritize clarity
3. **Update rules**: If rules are insufficient, update RULES.md first

### Deprecation Process

1. Mark document as deprecated in metadata
2. Add `replacedBy` field pointing to new document
3. Add deprecation notice at top of document
4. Update INDEX.md to show deprecated status
5. Update MAPPING.md to redirect references

## Examples

### Good Documentation

```markdown
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
  - id: questions-api
    type: references
tags:
  - ai
  - questions
  - evaluation
---

# Question Evaluation System

## Overview
The question evaluation system uses AI to analyze student questions...

## Related Documentation
- [AI Services](./services/ai.md) - Required: AI service implementation
- [Questions API](./api/questions.md) - References: API endpoints

## How It Works
[Content...]

## See Also
- [Gamification System](./features/gamification.md)
```

### Bad Documentation

```markdown
# Question Evaluation

Some info about questions.

See the AI stuff.
```

**Problems**:
- No metadata
- No structure
- Vague references
- No cross-references
- Inconsistent formatting

## Maintenance Checklist

When maintaining documentation, ensure:

- [ ] Follow structure rules
- [ ] Maintain cross-references
- [ ] Update metadata
- [ ] Validate links
- [ ] Update INDEX.md
- [ ] Update MAPPING.md
- [ ] Use consistent terminology
- [ ] Follow category-specific rules
- [ ] Check quality checklist
- [ ] Verify examples work

---

*These rules are maintained by AI agents. If you find inconsistencies, update this file and propagate changes to affected documents.*
