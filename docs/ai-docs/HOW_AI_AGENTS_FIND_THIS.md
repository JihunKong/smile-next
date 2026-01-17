# How AI Agents Discover This Documentation System

> **Purpose**: Explains all the discovery mechanisms for AI agents in different IDEs

## Discovery Mechanisms

AI agents in different IDEs can discover this documentation system through multiple entry points:

### 1. IDE-Specific Configuration Files

These files are automatically read by their respective IDEs:

#### Cursor IDE
- **File**: `.cursorrules` (root directory)
- **Purpose**: Cursor automatically reads this file and includes it in context
- **Content**: Quick reference to AI documentation system

#### Aider AI Assistant
- **File**: `.aiderignore` (root directory)
- **Purpose**: Aider reads this for project context
- **Content**: Documentation system references

#### Windsurf IDE
- **File**: `.windsurf` (root directory)
- **Purpose**: Windsurf configuration file
- **Content**: Documentation system instructions

#### Antigravity IDE
- **File**: `.antigravity` (root directory)
- **Purpose**: Antigravity configuration
- **Content**: Documentation system references

### 2. Root-Level Discovery Files

#### AI_DOCS.md
- **Location**: Root directory (`/AI_DOCS.md`)
- **Purpose**: Prominent discovery file that AI agents can easily find
- **Content**: Quick start guide and links to documentation system

### 3. README References

#### Main README.md
- **Location**: Root directory (`/README.md`)
- **Section**: "문서" (Documentation)
- **Content**: Links to AI documentation system with note for AI agents

### 4. Documentation Directory Files

#### docs/ai-docs/README.md
- **Purpose**: Main entry point for documentation system
- **Content**: Complete overview and navigation

#### docs/ai-docs/AI_AGENT_MEMORY.md
- **Purpose**: Quick reference guide (most important for AI agents)
- **Content**: Complete procedures and checklists

#### docs/ai-docs/DISCOVERY.md
- **Purpose**: Discovery guide
- **Content**: How to find and use the system

#### docs/ai-docs/.ai-discovery.md
- **Purpose**: Hidden discovery file in docs directory
- **Content**: Quick reference for AI agents

## How It Works

### When AI Agent Starts

1. **IDE reads configuration files**:
   - Cursor reads `.cursorrules`
   - Aider reads `.aiderignore`
   - Windsurf reads `.windsurf`
   - Antigravity reads `.antigravity`

2. **Agent searches for documentation**:
   - Finds `AI_DOCS.md` in root
   - Finds references in `README.md`
   - Discovers `docs/ai-docs/` directory

3. **Agent reads key files**:
   - `AI_AGENT_MEMORY.md` - Quick reference
   - `RULES.md` - Maintenance rules
   - `INDEX.md` - Document registry
   - `MAPPING.md` - Cross-references

### When AI Agent Modifies Documentation

1. **Agent checks for documentation system**:
   - Looks for `docs/ai-docs/` directory
   - Finds `AI_AGENT_MEMORY.md`
   - Reads `RULES.md`

2. **Agent follows procedures**:
   - Updates `INDEX.md` if structure changes
   - Updates `MAPPING.md` if relationships change
   - Runs validation: `node validate-docs.js`

## File Hierarchy

```
Project Root/
├── .cursorrules          # Cursor IDE config
├── .aiderignore          # Aider AI config
├── .windsurf             # Windsurf IDE config
├── .antigravity          # Antigravity IDE config
├── AI_DOCS.md            # Root-level discovery file
├── README.md             # Main README (references AI docs)
│
└── docs/ai-docs/
    ├── README.md         # Main entry point
    ├── AI_AGENT_MEMORY.md # Quick reference (MOST IMPORTANT)
    ├── RULES.md          # Maintenance rules
    ├── INDEX.md          # Document registry
    ├── MAPPING.md        # Cross-references
    ├── DISCOVERY.md      # Discovery guide
    └── .ai-discovery.md  # Hidden discovery file
```

## Best Practices for AI Agents

1. **Always check for documentation system**:
   - Look for `docs/ai-docs/` directory
   - Check for `AI_DOCS.md` in root
   - Read IDE configuration files

2. **Read key files first**:
   - `AI_AGENT_MEMORY.md` - Start here
   - `RULES.md` - Before making changes
   - `MAPPING.md` - To understand relationships

3. **Follow procedures**:
   - Update `INDEX.md` when adding/removing docs
   - Update `MAPPING.md` when relationships change
   - Run validation after changes

## Validation

After making changes, validate:

```bash
cd docs/ai-docs
node validate-docs.js
```

## Summary

AI agents can discover this system through:
- ✅ IDE configuration files (`.cursorrules`, `.aiderignore`, etc.)
- ✅ Root-level discovery file (`AI_DOCS.md`)
- ✅ README references
- ✅ Documentation directory structure
- ✅ Multiple entry points for redundancy

The system is designed to be easily discoverable by AI agents in any IDE.

---

*This file explains how AI agents discover the documentation system. For rules, see `RULES.md`.*
