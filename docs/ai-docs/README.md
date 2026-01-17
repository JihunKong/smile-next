# AI-Driven Documentation System

> **Fully automated documentation maintained by AI agents**  
> **Version**: 1.0.0

## Overview

This is a comprehensive, AI-maintained documentation system for the SMILE platform. All documentation follows consistent structures, maintains cross-references, and is automatically updated by AI agents.

## Quick Start

### For Developers

1. **Find Documentation**: Start at [INDEX.md](./INDEX.md) for a complete list
2. **Understand Structure**: Read [RULES.md](./RULES.md) for documentation standards
3. **Navigate**: Use cross-references in each document to explore related topics

### For AI Agents

1. **Read Rules First**: [RULES.md](./RULES.md) - Core maintenance guidelines
2. **Check Mapping**: [MAPPING.md](./MAPPING.md) - Document relationships
3. **Follow Procedures**: [MAINTENANCE.md](./MAINTENANCE.md) - Maintenance procedures
4. **Use Config**: [.ai-maintenance-config.json](./.ai-maintenance-config.json) - Configuration

## System Structure

```
docs/ai-docs/
├── README.md                    # This file
├── INDEX.md                     # Central document registry
├── RULES.md                     # AI maintenance rules
├── MAPPING.md                   # Cross-reference mapping
├── MAINTENANCE.md               # Maintenance procedures
├── .ai-maintenance-config.json  # AI configuration
│
├── api/                        # API documentation
│   ├── README.md
│   ├── questions.md
│   └── ...
│
├── components/                  # Component documentation
│   ├── README.md
│   └── ...
│
├── services/                    # Service documentation
│   ├── README.md
│   ├── ai.md
│   └── ...
│
├── features/                    # Feature documentation
│   ├── README.md
│   ├── question-evaluation.md
│   └── ...
│
├── architecture/                # Architecture documentation
│   ├── README.md
│   └── ...
│
└── guides/                      # Guide documentation
    ├── README.md
    └── ...
```

## Key Features

### 1. Consistent Structure
- All documents follow standardized templates
- Uniform metadata format (YAML frontmatter)
- Consistent section organization

### 2. Cross-Reference System
- Bidirectional references where appropriate
- Dependency tracking
- Relationship mapping in MAPPING.md

### 3. Automated Maintenance
- AI agents update documentation automatically
- Link validation
- Metadata consistency checks
- Registry updates

### 4. Category Organization
- **API**: Endpoint documentation
- **Components**: React component docs
- **Services**: Service layer documentation
- **Features**: Feature documentation
- **Architecture**: System design docs
- **Guides**: How-to guides

## Documentation Standards

### Metadata Format

Every document includes YAML frontmatter:

```yaml
---
id: unique-identifier
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

### Link Format

- Internal links: `[Text](./path/to/doc.md)`
- Section links: `[Text](./path/to/doc.md#section)`
- External links: `[Text](https://...)`

### Cross-Reference Types

- **depends-on**: Required reading (one-way)
- **references**: Mentions/uses (one-way)
- **see-also**: Related reading (bidirectional)

## Maintenance

### Automated Updates

AI agents automatically:
- Update documentation when code changes
- Maintain cross-references
- Validate links
- Update registry files (INDEX.md, MAPPING.md)
- Keep metadata current

### Manual Updates

If manual updates are needed:
1. Follow [RULES.md](./RULES.md)
2. Update INDEX.md and MAPPING.md
3. Maintain consistency
4. Validate all links

## Validation

Run validation to check documentation consistency:

```bash
# Check all links are valid
# Verify metadata is complete
# Ensure cross-references are consistent
# Validate document structure
```

See [MAINTENANCE.md](./MAINTENANCE.md) for validation procedures.

## Contributing

### Adding New Documentation

1. Create document in appropriate category
2. Follow category template (see category README)
3. Add metadata (YAML frontmatter)
4. Update INDEX.md
5. Update MAPPING.md
6. Add cross-references

### Updating Existing Documentation

1. Update content
2. Update `lastUpdated` in metadata
3. Increment version if breaking changes
4. Update cross-references if needed
5. Update INDEX.md and MAPPING.md

## Resources

- **Getting Started**: [INDEX.md](./INDEX.md)
- **AI Agent Memory**: [AI_AGENT_MEMORY.md](./AI_AGENT_MEMORY.md) - Quick reference for AI agents
- **Maintenance Rules**: [RULES.md](./RULES.md)
- **Cross-References**: [MAPPING.md](./MAPPING.md)
- **Maintenance Guide**: [MAINTENANCE.md](./MAINTENANCE.md)
- **Configuration**: [.ai-maintenance-config.json](./.ai-maintenance-config.json)

## Status

| Category | Documents | Status |
|----------|-----------|--------|
| API | 6+ | ✅ Maintained |
| Components | 4+ | ✅ Maintained |
| Services | 4+ | ✅ Maintained |
| Features | 5+ | ✅ Maintained |
| Architecture | 4+ | ✅ Maintained |
| Guides | 4+ | ✅ Maintained |

## Support

For questions or issues:
1. Check [RULES.md](./RULES.md) for guidelines
2. Review [MAINTENANCE.md](./MAINTENANCE.md) for procedures
3. Check [MAPPING.md](./MAPPING.md) for relationships

---

*This documentation system is maintained by AI agents. See [RULES.md](./RULES.md) for maintenance guidelines.*
