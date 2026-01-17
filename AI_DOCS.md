# AI Documentation System

> **For AI Agents**: This project uses an automated AI-driven documentation system.  
> **Location**: `docs/ai-docs/`

## Quick Discovery

If you're an AI agent working on this codebase, this file will help you understand how to manage the documentation system.

## Essential Files (Read First)

1. **`docs/ai-docs/AI_AGENT_MEMORY.md`** - Quick reference guide (START HERE)
2. **`docs/ai-docs/RULES.md`** - Core maintenance rules
3. **`docs/ai-docs/INDEX.md`** - Central document registry
4. **`docs/ai-docs/MAPPING.md`** - Cross-reference mapping

## When You Need to Modify Documentation

### Before Making Changes

1. Read `docs/ai-docs/RULES.md` - Understand the rules
2. Check `docs/ai-docs/MAPPING.md` - Understand relationships
3. Review `docs/ai-docs/AI_AGENT_MEMORY.md` - Quick reference

### Making Changes

1. Follow the structure rules in `docs/ai-docs/RULES.md`
2. Update metadata (lastUpdated, version)
3. Maintain cross-references
4. Update `docs/ai-docs/INDEX.md` if adding/removing docs
5. Update `docs/ai-docs/MAPPING.md` if relationships change

### After Making Changes

1. Run validation: `cd docs/ai-docs && node validate-docs.js`
2. Verify all links are valid
3. Check metadata is complete

## Documentation Categories

- **API**: `docs/ai-docs/api/` - API endpoint documentation
- **Components**: `docs/ai-docs/components/` - React components
- **Services**: `docs/ai-docs/services/` - Service layer
- **Features**: `docs/ai-docs/features/` - Feature documentation
- **Architecture**: `docs/ai-docs/architecture/` - System design
- **Guides**: `docs/ai-docs/guides/` - How-to guides

## Required Metadata

All documentation files must include YAML frontmatter:

```yaml
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
  - tag1
---
```

## Validation

After making changes, validate:

```bash
cd docs/ai-docs
node validate-docs.js
```

## Full Documentation

See `docs/ai-docs/README.md` for complete overview.

---

*This file is a discovery mechanism for AI agents. For detailed rules, see `docs/ai-docs/RULES.md`.*
