/**
 * Keyword Matching Utilities
 * Provides fuzzy matching and text analysis for keyword validation
 */

// Configuration for matching sensitivity
export interface MatchConfig {
  minSimilarity: number // 0-1, default 0.8
  caseSensitive: boolean // default false
  allowPartialMatch: boolean // default true
  minWordLength: number // default 3
}

const DEFAULT_CONFIG: MatchConfig = {
  minSimilarity: 0.8,
  caseSensitive: false,
  allowPartialMatch: true,
  minWordLength: 3,
}

// Result of a single keyword match attempt
export interface MatchResult {
  keyword: string
  matched: boolean
  score: number // 0-1
  matchedWord?: string
  position?: number
}

// Normalize text for comparison
function normalizeText(text: string, caseSensitive: boolean): string {
  let normalized = text.trim()
  if (!caseSensitive) {
    normalized = normalized.toLowerCase()
  }
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ')
  return normalized
}

// Calculate Jaro-Winkler similarity (more accurate than Levenshtein for short strings)
function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1

  const len1 = s1.length
  const len2 = s2.length

  if (len1 === 0 || len2 === 0) return 0

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1
  const s1Matches = new Array(len1).fill(false)
  const s2Matches = new Array(len2).fill(false)

  let matches = 0
  let transpositions = 0

  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance)
    const end = Math.min(i + matchDistance + 1, len2)

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue
      s1Matches[i] = true
      s2Matches[j] = true
      matches++
      break
    }
  }

  if (matches === 0) return 0

  // Count transpositions
  let k = 0
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue
    while (!s2Matches[k]) k++
    if (s1[i] !== s2[k]) transpositions++
    k++
  }

  // Jaro similarity
  const jaro =
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3

  // Winkler modification: boost for common prefix
  let prefix = 0
  for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
    if (s1[i] === s2[i]) prefix++
    else break
  }

  return jaro + prefix * 0.1 * (1 - jaro)
}

// Find best match for a keyword in text
export function findBestMatch(
  keyword: string,
  text: string,
  config: Partial<MatchConfig> = {}
): MatchResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  const normalizedKeyword = normalizeText(keyword, cfg.caseSensitive)
  const normalizedText = normalizeText(text, cfg.caseSensitive)

  // Check for exact match first
  if (normalizedText.includes(normalizedKeyword)) {
    const position = normalizedText.indexOf(normalizedKeyword)
    return {
      keyword,
      matched: true,
      score: 1.0,
      matchedWord: keyword,
      position,
    }
  }

  // If partial match not allowed, return no match
  if (!cfg.allowPartialMatch) {
    return {
      keyword,
      matched: false,
      score: 0,
    }
  }

  // Split into words and find best fuzzy match
  const words = normalizedText.split(/\s+/).filter((w) => w.length >= cfg.minWordLength)
  const keywordWords = normalizedKeyword.split(/\s+/)

  let bestScore = 0
  let bestWord = ''
  let bestPosition = -1

  for (const word of words) {
    for (const kw of keywordWords) {
      const similarity = jaroWinklerSimilarity(word, kw)
      if (similarity > bestScore) {
        bestScore = similarity
        bestWord = word
        bestPosition = normalizedText.indexOf(word)
      }
    }
  }

  const matched = bestScore >= cfg.minSimilarity

  return {
    keyword,
    matched,
    score: Math.round(bestScore * 100) / 100,
    matchedWord: matched ? bestWord : undefined,
    position: matched ? bestPosition : undefined,
  }
}

// Match multiple keywords against text
export function matchKeywords(
  keywords: string[],
  text: string,
  config: Partial<MatchConfig> = {}
): {
  results: MatchResult[]
  matchedCount: number
  totalCount: number
  matchRate: number
} {
  const results = keywords.map((kw) => findBestMatch(kw, text, config))
  const matchedCount = results.filter((r) => r.matched).length

  return {
    results,
    matchedCount,
    totalCount: keywords.length,
    matchRate: keywords.length > 0 ? Math.round((matchedCount / keywords.length) * 100) / 100 : 0,
  }
}

// Extract potential keywords from text (simple approach)
export function extractPotentialKeywords(
  text: string,
  maxKeywords: number = 20
): string[] {
  const normalized = normalizeText(text, false)

  // Common stopwords to filter out
  const stopwords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'shall',
    'can',
    'need',
    'dare',
    'ought',
    'used',
    'to',
    'of',
    'in',
    'for',
    'on',
    'with',
    'at',
    'by',
    'from',
    'as',
    'into',
    'through',
    'during',
    'before',
    'after',
    'above',
    'below',
    'between',
    'under',
    'again',
    'further',
    'then',
    'once',
    'this',
    'that',
    'these',
    'those',
    'it',
    'its',
  ])

  // Split into words and count frequencies
  const words = normalized.split(/\s+/)
  const wordCounts = new Map<string, number>()

  for (const word of words) {
    // Skip short words and stopwords
    if (word.length < 4 || stopwords.has(word)) continue
    // Skip words with numbers
    if (/\d/.test(word)) continue

    wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
  }

  // Sort by frequency and return top keywords
  const sorted = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)

  return sorted
}
