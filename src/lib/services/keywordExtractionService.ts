import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Types
export interface KeywordExtractionRequest {
  chapterText: string // >= 100 characters
  pool1Count: number // 3-15
  pool2Count: number // 3-15
  activityContext?: {
    name: string
    subject: string
  }
}

export interface KeywordExtractionResponse {
  keywordPool1: string[] // Core keywords
  keywordPool2: string[] // Supporting keywords
  theme: string // Main theme
  instruction: string // Suggested instruction
  samplePrompts: string[] // 3 sample prompts
  metadata: {
    inputLength: number
    processingTimeMs: number
    generatedAt: string
  }
}

export interface KeywordValidationRequest {
  keywords: string[]
  studentResponse: string
}

export interface KeywordValidationResponse {
  matches: {
    keyword: string
    found: boolean
    matchType: 'exact' | 'fuzzy' | 'not_found'
    context?: string
  }[]
  totalMatched: number
  matchRate: number
}

// Extract keywords from chapter text using AI
export async function extractKeywords(
  request: KeywordExtractionRequest
): Promise<KeywordExtractionResponse | null> {
  const startTime = Date.now()

  // Validate input
  if (request.chapterText.length < 100) {
    return null
  }

  const pool1Count = Math.min(15, Math.max(3, request.pool1Count))
  const pool2Count = Math.min(15, Math.max(3, request.pool2Count))

  // Truncate text if too long (to manage tokens)
  const maxLength = 4000
  const truncatedText =
    request.chapterText.length > maxLength
      ? request.chapterText.substring(0, maxLength) + '...'
      : request.chapterText

  const contextInfo = request.activityContext
    ? `Activity: ${request.activityContext.name}, Subject: ${request.activityContext.subject}`
    : 'General educational context'

  const prompt = `You are an educational content analyzer. Extract inquiry-based keywords from the following text for a classroom activity.

Context: ${contextInfo}

Text to analyze:
"""
${truncatedText}
"""

Extract keywords for inquiry-based learning:
1. Pool 1 (Core Keywords): ${pool1Count} essential concepts students MUST understand
2. Pool 2 (Supporting Keywords): ${pool2Count} related concepts that support deeper understanding

Also provide:
- Main theme of the content
- A suggested instruction for students to formulate questions using these keywords
- 3 sample question prompts students could create

Respond in JSON format:
{
  "keywordPool1": ["keyword1", "keyword2", ...],
  "keywordPool2": ["keyword1", "keyword2", ...],
  "theme": "Main theme of the content",
  "instruction": "Student instruction for question formulation",
  "samplePrompts": ["Sample question 1", "Sample question 2", "Sample question 3"]
}

Keywords should be:
- Single words or short phrases (2-3 words max)
- Academically relevant
- Appropriate for student inquiry
- In the same language as the input text`

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const aiResponse = JSON.parse(completion.choices[0]?.message?.content || '{}')
    const processingTimeMs = Date.now() - startTime

    return {
      keywordPool1: (aiResponse.keywordPool1 || []).slice(0, pool1Count),
      keywordPool2: (aiResponse.keywordPool2 || []).slice(0, pool2Count),
      theme: aiResponse.theme || 'General topic',
      instruction:
        aiResponse.instruction || 'Create questions using the provided keywords.',
      samplePrompts: (aiResponse.samplePrompts || []).slice(0, 3),
      metadata: {
        inputLength: request.chapterText.length,
        processingTimeMs,
        generatedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error('Failed to extract keywords:', error)
    return null
  }
}

// Validate keywords in student response using fuzzy matching
export function validateKeywords(
  request: KeywordValidationRequest
): KeywordValidationResponse {
  const normalizedResponse = request.studentResponse.toLowerCase()

  const matches = request.keywords.map((keyword) => {
    const normalizedKeyword = keyword.toLowerCase()

    // Check for exact match
    if (normalizedResponse.includes(normalizedKeyword)) {
      // Find context (surrounding words)
      const index = normalizedResponse.indexOf(normalizedKeyword)
      const start = Math.max(0, index - 30)
      const end = Math.min(normalizedResponse.length, index + normalizedKeyword.length + 30)
      const context = '...' + normalizedResponse.substring(start, end) + '...'

      return {
        keyword,
        found: true,
        matchType: 'exact' as const,
        context,
      }
    }

    // Check for fuzzy match (simple Levenshtein-based)
    const words = normalizedResponse.split(/\s+/)
    const keywordWords = normalizedKeyword.split(/\s+/)

    for (const word of words) {
      for (const keyWord of keywordWords) {
        const distance = levenshteinDistance(word, keyWord)
        const maxLen = Math.max(word.length, keyWord.length)
        const similarity = 1 - distance / maxLen

        if (similarity >= 0.8 && word.length >= 3) {
          return {
            keyword,
            found: true,
            matchType: 'fuzzy' as const,
            context: `Similar word found: "${word}"`,
          }
        }
      }
    }

    return {
      keyword,
      found: false,
      matchType: 'not_found' as const,
    }
  })

  const totalMatched = matches.filter((m) => m.found).length
  const matchRate = request.keywords.length > 0 ? totalMatched / request.keywords.length : 0

  return {
    matches,
    totalMatched,
    matchRate: Math.round(matchRate * 100) / 100,
  }
}

// Simple Levenshtein distance implementation
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length

  // Create distance matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  // Initialize first column
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i
  }

  // Initialize first row
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        )
      }
    }
  }

  return dp[m][n]
}
