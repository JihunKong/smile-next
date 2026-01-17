# Quick Start Guide for AI Agents

## Overview

This documentation system is **fully automated** and maintained by AI agents. All documents follow consistent structures and maintain cross-references automatically.

## For AI Agents

### Initial Setup

1. **Read the Rules**: [RULES.md](./RULES.md) - Core maintenance guidelines
2. **Understand Mapping**: [MAPPING.md](./MAPPING.md) - Document relationships
3. **Check Config**: [.ai-maintenance-config.json](./.ai-maintenance-config.json) - Configuration

### When Modifying Documentation

1. **Before Changes**:
   - Read [RULES.md](./RULES.md)
   - Check [MAPPING.md](./MAPPING.md) for dependencies
   - Review [MAINTENANCE.md](./MAINTENANCE.md) for procedures

2. **During Changes**:
   - Follow document structure rules
   - Maintain cross-references
   - Update metadata (lastUpdated, version)

3. **After Changes**:
   - Update [INDEX.md](./INDEX.md) if structure changed
   - Update [MAPPING.md](./MAPPING.md) if relationships changed
   - Validate using `node validate-docs.js`

### Key Files

- **INDEX.md**: Central registry - update when adding/removing docs
- **MAPPING.md**: Cross-reference graph - update when relationships change
- **RULES.md**: Maintenance rules - follow for all changes
- **MAINTENANCE.md**: Procedures - follow for maintenance tasks

## For Developers

### Finding Documentation

1. Start at [INDEX.md](./INDEX.md) for a complete list
2. Browse by category:
   - [API Documentation](./api/)
   - [Components](./components/)
   - [Services](./services/)
   - [Features](./features/)
   - [Architecture](./architecture/)
   - [Guides](./guides/)

### Understanding Structure

- Each document has YAML frontmatter with metadata
- Documents link to related docs in "Related Documentation" section
- Cross-references are maintained in [MAPPING.md](./MAPPING.md)

### Contributing

If you need to add documentation manually:

1. Create document in appropriate category
2. Follow template from category README
3. Add metadata (YAML frontmatter)
4. Update INDEX.md
5. Update MAPPING.md
6. Run validation: `node validate-docs.js`

## Validation

Run the validation script to check documentation:

```bash
cd docs/ai-docs
node validate-docs.js
```

This checks:
- ✅ Metadata completeness
- ✅ Link validity
- ✅ Cross-reference consistency
- ✅ Document structure

## Common Tasks

### Adding New Documentation

```markdown
1. Create file in appropriate category
2. Add YAML frontmatter:
   ---
   id: unique-id
   title: Document Title
   category: api|components|services|features|architecture|guides
   lastUpdated: YYYY-MM-DD
   maintainedBy: ai-agent
   version: 1.0.0
   relatedDocs:
     - id: related-doc
       type: depends-on|references|see-also
   tags:
     - tag1
   ---
3. Follow category template
4. Update INDEX.md
5. Update MAPPING.md
6. Validate
```

### Updating Existing Documentation

```markdown
1. Update content
2. Update lastUpdated in metadata
3. Increment version if breaking changes
4. Update cross-references if needed
5. Update INDEX.md and MAPPING.md if structure changed
6. Validate
```

### Fixing Broken Links

```markdown
1. Run validation to find broken links
2. Fix or remove broken links
3. Update MAPPING.md if relationships changed
4. Re-validate
```

## Best Practices

1. **Consistency**: Follow templates and patterns
2. **Cross-References**: Always add related documentation links
3. **Metadata**: Keep metadata current and complete
4. **Validation**: Run validation before committing
5. **Updates**: Update INDEX.md and MAPPING.md when structure changes

## Getting Help

- **Rules**: [RULES.md](./RULES.md) - Maintenance guidelines
- **Mapping**: [MAPPING.md](./MAPPING.md) - Document relationships
- **Maintenance**: [MAINTENANCE.md](./MAINTENANCE.md) - Procedures
- **Index**: [INDEX.md](./INDEX.md) - Document registry

---

*This system is maintained by AI agents. See [RULES.md](./RULES.md) for guidelines.*
