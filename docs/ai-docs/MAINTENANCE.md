# AI Documentation Maintenance Guide

> **For AI Agents**: This document provides automated maintenance procedures  
> **Version**: 1.0.0

## Quick Reference

- **Rules**: [RULES.md](./RULES.md) - Core maintenance rules
- **Index**: [INDEX.md](./INDEX.md) - Document registry
- **Mapping**: [MAPPING.md](./MAPPING.md) - Cross-reference graph
- **Config**: [.ai-maintenance-config.json](./.ai-maintenance-config.json) - Configuration

## Automated Maintenance Procedures

### When Code Changes

1. **Identify Affected Documents**
   ```bash
   # Check MAPPING.md for dependencies
   # Find documents that reference changed code
   ```

2. **Update Documentation**
   - Update relevant sections
   - Update `lastUpdated` metadata
   - Update version if breaking changes

3. **Validate Changes**
   - Check all links are valid
   - Verify cross-references
   - Ensure metadata is complete

4. **Update Registry**
   - Update INDEX.md if structure changed
   - Update MAPPING.md if relationships changed

### When Adding New Documentation

1. **Create Document**
   - Use appropriate template from category README
   - Add YAML frontmatter with metadata
   - Follow structure rules

2. **Update Registry**
   - Add entry to INDEX.md
   - Add entry to category README
   - Add relationships to MAPPING.md

3. **Add Cross-References**
   - Add to source document's `relatedDocs`
   - Add reverse references in target documents
   - Update MAPPING.md

4. **Validate**
   - Check all links
   - Verify metadata
   - Ensure structure compliance

### When Removing Documentation

1. **Mark as Deprecated**
   - Add `deprecated: true` to metadata
   - Add `replacedBy` if applicable
   - Add deprecation notice

2. **Update Registry**
   - Remove from INDEX.md (or mark deprecated)
   - Remove from category README
   - Update MAPPING.md

3. **Update References**
   - Find all documents referencing removed doc
   - Update or remove references
   - Update MAPPING.md

## Validation Checklist

Before committing documentation changes:

- [ ] All required metadata fields present
- [ ] YAML frontmatter is valid
- [ ] All links valid (internal and external)
- [ ] Cross-references are bidirectional where appropriate
- [ ] INDEX.md is updated
- [ ] MAPPING.md is updated
- [ ] Category README is updated
- [ ] Terminology is consistent
- [ ] Code examples are accurate
- [ ] Version numbers are appropriate

## Automated Validation Script

AI agents should validate:

```typescript
// Pseudo-code for validation
function validateDocumentation() {
  // 1. Check all documents have metadata
  checkMetadata();
  
  // 2. Validate all links
  validateLinks();
  
  // 3. Check cross-reference consistency
  checkCrossReferences();
  
  // 4. Verify INDEX.md completeness
  verifyIndex();
  
  // 5. Verify MAPPING.md completeness
  verifyMapping();
  
  // 6. Check document structure
  checkStructure();
}
```

## Common Tasks

### Update Document Metadata

```yaml
---
id: document-id
title: Document Title
category: api
lastUpdated: 2024-01-15  # Update this
maintainedBy: ai-agent
version: 1.0.1  # Increment if needed
relatedDocs:
  - id: related-doc
    type: depends-on
tags:
  - tag1
---
```

### Add Cross-Reference

1. In source document:
   ```yaml
   relatedDocs:
     - id: new-reference
       type: references
   ```

2. In MAPPING.md:
   ```markdown
   #### Source Document
   - **references**:
     - `target-document` - Description
   ```

3. In target document (if bidirectional):
   ```yaml
   relatedDocs:
     - id: source-document
       type: see-also
   ```

### Update INDEX.md

```markdown
## API Documentation
- [New API](./api/new-api.md) - Description
```

### Update MAPPING.md

```markdown
#### New Document (`category/new-doc.md`)
- **depends-on**:
  - `required-doc` - Why it's required
- **references**:
  - `referenced-doc` - How it's used
```

## Error Handling

### Broken Links

1. Identify broken link
2. Find correct target or remove link
3. Update document
4. Log issue for review

### Missing Metadata

1. Add required metadata fields
2. Use defaults where appropriate
3. Update document

### Inconsistent References

1. Check MAPPING.md for correct relationships
2. Update source and target documents
3. Ensure bidirectional references where needed

## Maintenance Schedule

- **On Code Changes**: Immediate update
- **On New Features**: Create documentation within same PR
- **Weekly**: Validate all links and references
- **Monthly**: Review and update outdated content

## Reporting Issues

If documentation issues are found:

1. Document the issue
2. Identify affected documents
3. Fix following maintenance procedures
4. Update relevant registry files
5. Validate changes

---

*This guide is for AI agents. Human contributors should follow [RULES.md](./RULES.md) for manual edits.*
