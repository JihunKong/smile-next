# AI Agent Memory: Documentation System Management

> **Purpose**: Quick reference for AI agents managing this documentation system  
> **Location**: `docs/ai-docs/`  
> **Last Updated**: 2024-01-15

## Quick Reference

### Essential Files (Read First)

1. **RULES.md** - Core maintenance rules (READ BEFORE ANY CHANGES)
2. **MAPPING.md** - Cross-reference relationships
3. **INDEX.md** - Central document registry
4. **MAINTENANCE.md** - Maintenance procedures

### File Purposes

| File | Purpose | When to Update |
|------|---------|----------------|
| `INDEX.md` | Central registry of all documents | When adding/removing docs |
| `MAPPING.md` | Cross-reference graph | When relationships change |
| `RULES.md` | Maintenance guidelines | When rules change |
| `MAINTENANCE.md` | Procedures | When procedures change |
| `validate-docs.js` | Validation script | Run after changes |

## Required Metadata Template

```yaml
---
id: unique-identifier          # kebab-case, unique
title: Document Title          # Human-readable
category: api                  # api|components|services|features|architecture|guides
lastUpdated: YYYY-MM-DD        # ISO date
maintainedBy: ai-agent         # Always "ai-agent"
version: 1.0.0                 # Semantic versioning
relatedDocs:
  - id: doc-id
    type: depends-on|references|see-also
tags:
  - tag1
---
```

## Cross-Reference Types

- **depends-on**: Document A requires Document B (one-way)
- **references**: Document A mentions/uses Document B (one-way)
- **see-also**: Related but not required (bidirectional)

## Maintenance Workflow

### Before Changes
1. ✅ Read `RULES.md`
2. ✅ Check `MAPPING.md` for dependencies
3. ✅ Identify all affected documents

### During Changes
1. ✅ Follow document structure rules
2. ✅ Maintain cross-references
3. ✅ Update metadata (lastUpdated, version)
4. ✅ Use consistent terminology

### After Changes
1. ✅ Update `INDEX.md` if structure changed
2. ✅ Update `MAPPING.md` if relationships changed
3. ✅ Run validation: `node validate-docs.js`
4. ✅ Verify all links are valid

## Adding New Documentation

```markdown
1. Create file in category folder (api|components|services|features|architecture|guides)
2. Add YAML frontmatter with required metadata
3. Follow category template (see category README.md)
4. Add "Related Documentation" section
5. Update INDEX.md - add entry to appropriate section
6. Update MAPPING.md - add relationships
7. Add reverse references in target documents (if bidirectional)
8. Update category README.md if needed
9. Run validation: node validate-docs.js
```

## Updating Existing Documentation

```markdown
1. Update content
2. Update lastUpdated in metadata
3. Increment version if breaking changes (1.0.0 → 1.1.0)
4. Update cross-references if needed
5. Update INDEX.md if structure changed
6. Update MAPPING.md if relationships changed
7. Run validation
```

## Category Structure

Each category has:
- `README.md` - Overview and template
- Individual docs following the template

### Categories

- **api/** - API endpoint documentation
  - Template: Request/Response, Authentication, Examples
- **components/** - React component documentation
  - Template: Props, Usage, Examples, Implementation
- **services/** - Service layer documentation
  - Template: Functions, Dependencies, Configuration
- **features/** - Feature documentation
  - Template: User Stories, Workflow, Technical Implementation
- **architecture/** - Architecture documentation
  - Template: Overview, Components, Patterns
- **guides/** - How-to guides
  - Template: Prerequisites, Steps, Common Issues

## Validation Checklist

Before committing:

- [ ] All required metadata fields present
- [ ] YAML frontmatter is valid
- [ ] All links valid (internal and external)
- [ ] Cross-references are bidirectional where appropriate
- [ ] INDEX.md is updated
- [ ] MAPPING.md is updated
- [ ] Category README.md is updated (if needed)
- [ ] Terminology is consistent
- [ ] Code examples are accurate
- [ ] Version numbers are appropriate

## Validation Command

```bash
cd docs/ai-docs
node validate-docs.js
```

Checks:
- ✅ Metadata completeness
- ✅ Link validity
- ✅ Cross-reference consistency
- ✅ Document structure

## Key Principles

1. **Consistency First** - All docs follow same structure
2. **Cross-Reference Integrity** - Every doc links to related docs
3. **Metadata Maintenance** - All docs have YAML frontmatter
4. **Automated Updates** - Update INDEX.md and MAPPING.md automatically

## Common Patterns

### Adding Cross-Reference

**In source document:**
```yaml
relatedDocs:
  - id: target-doc
    type: references
```

**In MAPPING.md:**
```markdown
#### Source Document (`category/source.md`)
- **references**:
  - `target-doc` - Description
```

**In target document (if bidirectional):**
```yaml
relatedDocs:
  - id: source-doc
    type: see-also
```

### Updating INDEX.md

```markdown
## API Documentation
- [New API](./api/new-api.md) - Description
```

### Updating MAPPING.md

```markdown
#### New Document (`category/new-doc.md`)
- **depends-on**:
  - `required-doc` - Why required
- **references**:
  - `referenced-doc` - How used
```

## Error Handling

### Broken Links
1. Identify broken link
2. Find correct target or remove
3. Update document
4. Update MAPPING.md if needed

### Missing Metadata
1. Add required fields
2. Use defaults where appropriate
3. Update document

### Inconsistent References
1. Check MAPPING.md for correct relationships
2. Update source and target documents
3. Ensure bidirectional where needed

## Quick Commands

```bash
# Validate documentation
cd docs/ai-docs && node validate-docs.js

# Find all markdown files
find docs/ai-docs -name "*.md" -type f

# Check for broken links (after validation)
grep -r "Broken link" validation-output.txt
```

## Remember

- **Always read RULES.md first**
- **Update INDEX.md when structure changes**
- **Update MAPPING.md when relationships change**
- **Run validation after changes**
- **Maintain consistency across all docs**

---

*This memory guide is for AI agents. For detailed rules, see [RULES.md](./RULES.md).*
