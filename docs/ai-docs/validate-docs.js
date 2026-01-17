#!/usr/bin/env node

/**
 * Documentation Validation Script
 * 
 * Validates AI-maintained documentation for:
 * - Metadata completeness
 * - Link validity
 * - Cross-reference consistency
 * - Structure compliance
 * 
 * Usage: node validate-docs.js [--fix]
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = __dirname;
const CONFIG_FILE = path.join(DOCS_DIR, '.ai-maintenance-config.json');

// Load configuration
const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

// Validation results
const errors = [];
const warnings = [];
const fixed = [];

/**
 * Extract YAML frontmatter from markdown
 */
function extractFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { metadata: null, body: content };
  }
  
  try {
    // Simple YAML parser (for basic key-value pairs)
    const metadata = {};
    const lines = match[1].split('\n');
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        // Handle arrays
        if (key === 'relatedDocs' || key === 'tags') {
          // Simple array parsing (would need proper YAML parser for complex cases)
          continue;
        }
        
        metadata[key] = value;
      }
    }
    
    return { metadata, body: match[2] };
  } catch (e) {
    return { metadata: null, body: content };
  }
}

/**
 * Find all markdown files recursively
 */
function findMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findMarkdownFiles(filePath, fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * Extract links from markdown content
 */
function extractLinks(content, filePath) {
  const links = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    const [fullMatch, text, url] = match;
    links.push({
      text,
      url,
      fullMatch,
      line: content.substring(0, match.index).split('\n').length,
      filePath
    });
  }
  
  return links;
}

/**
 * Validate document metadata
 */
function validateMetadata(filePath, metadata, content) {
  const requiredFields = ['id', 'title', 'category', 'lastUpdated', 'maintainedBy', 'version'];
  const relativePath = path.relative(DOCS_DIR, filePath);
  
  if (!metadata) {
    errors.push(`❌ ${relativePath}: Missing YAML frontmatter`);
    return false;
  }
  
  let isValid = true;
  
  for (const field of requiredFields) {
    if (!metadata[field]) {
      errors.push(`❌ ${relativePath}: Missing required field '${field}'`);
      isValid = false;
    }
  }
  
  // Validate category
  const validCategories = ['api', 'components', 'services', 'features', 'architecture', 'guides'];
  if (metadata.category && !validCategories.includes(metadata.category)) {
    errors.push(`❌ ${relativePath}: Invalid category '${metadata.category}'`);
    isValid = false;
  }
  
  // Check for 'Related Documentation' section
  if (!content.includes('## Related Documentation') && !content.includes('### Related Documentation')) {
    warnings.push(`⚠️  ${relativePath}: Missing 'Related Documentation' section`);
  }
  
  return isValid;
}

/**
 * Validate links
 */
function validateLinks(filePath, links, allFiles) {
  const relativePath = path.relative(DOCS_DIR, filePath);
  const fileDir = path.dirname(filePath);
  
  for (const link of links) {
    // Skip external links
    if (link.url.startsWith('http://') || link.url.startsWith('https://')) {
      continue;
    }
    
    // Skip anchor-only links
    if (link.url.startsWith('#')) {
      continue;
    }
    
    // Resolve relative path
    let targetPath = path.resolve(fileDir, link.url);
    
    // Handle anchor links
    const anchorIndex = link.url.indexOf('#');
    if (anchorIndex > 0) {
      targetPath = path.resolve(fileDir, link.url.substring(0, anchorIndex));
    }
    
    // Check if file exists
    if (!fs.existsSync(targetPath)) {
      errors.push(`❌ ${relativePath}:${link.line}: Broken link to '${link.url}'`);
    } else {
      // Check if it's a markdown file in our docs
      const targetRelative = path.relative(DOCS_DIR, targetPath);
      if (targetRelative.startsWith('..')) {
        warnings.push(`⚠️  ${relativePath}:${link.line}: Link points outside docs: '${link.url}'`);
      }
    }
  }
}

/**
 * Main validation function
 */
function validate() {
  console.log('🔍 Validating AI documentation...\n');
  
  const allFiles = findMarkdownFiles(DOCS_DIR);
  const fileMap = new Map();
  
  // First pass: collect all files and their metadata
  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const { metadata, body } = extractFrontmatter(content);
    
    fileMap.set(filePath, {
      content,
      metadata,
      body,
      links: extractLinks(content, filePath)
    });
    
    // Validate metadata
    validateMetadata(filePath, metadata, body);
  }
  
  // Second pass: validate links
  for (const [filePath, fileData] of fileMap) {
    validateLinks(filePath, fileData.links, allFiles);
  }
  
  // Check INDEX.md references
  const indexPath = path.join(DOCS_DIR, 'INDEX.md');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const indexLinks = extractLinks(indexContent, indexPath);
    
    for (const link of indexLinks) {
      if (link.url.startsWith('./')) {
        const targetPath = path.resolve(path.dirname(indexPath), link.url);
        if (!fs.existsSync(targetPath)) {
          errors.push(`❌ INDEX.md: Broken reference to '${link.url}'`);
        }
      }
    }
  }
  
  // Print results
  console.log(`\n📊 Validation Results:\n`);
  console.log(`   Files checked: ${allFiles.length}`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}\n`);
  
  if (errors.length > 0) {
    console.log('❌ Errors:\n');
    errors.forEach(err => console.log(`   ${err}`));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    warnings.forEach(warn => console.log(`   ${warn}`));
    console.log('');
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All documentation is valid!\n');
    return 0;
  }
  
  return errors.length > 0 ? 1 : 0;
}

// Run validation
if (require.main === module) {
  const exitCode = validate();
  process.exit(exitCode);
}

module.exports = { validate, extractFrontmatter, findMarkdownFiles };
