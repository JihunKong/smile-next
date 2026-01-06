/**
 * SMILE AI Prompts - Flask Parity Version
 *
 * These prompts are designed to match the Flask original implementation,
 * providing comprehensive Bloom's Taxonomy evaluation, detailed feedback,
 * and pedagogical guidance.
 */

export interface BloomsLevelConfig {
  name: string
  description: string
  keywords: string[]
  exemplars: string[]
  scoringCriteria: string
}

export const BLOOMS_TAXONOMY: Record<string, BloomsLevelConfig> = {
  remember: {
    name: 'Remember',
    description: 'Retrieve relevant knowledge from long-term memory. Questions at this level ask students to recall, recognize, or retrieve basic facts and concepts.',
    keywords: [
      'define', 'identify', 'list', 'name', 'recall', 'recognize', 'state',
      'match', 'label', 'select', 'locate', 'memorize', 'repeat', 'describe',
      'what is', 'when did', 'who was', 'where is', 'which one'
    ],
    exemplars: [
      'What is the definition of photosynthesis?',
      'Name the three branches of government.',
      'List the planets in our solar system.',
      'When did World War II end?'
    ],
    scoringCriteria: 'Question asks for factual recall with little to no cognitive processing required beyond memory retrieval.'
  },
  understand: {
    name: 'Understand',
    description: 'Construct meaning from instructional messages. Questions at this level ask students to interpret, exemplify, classify, summarize, infer, compare, or explain.',
    keywords: [
      'explain', 'describe', 'interpret', 'summarize', 'paraphrase', 'classify',
      'compare', 'contrast', 'discuss', 'distinguish', 'predict', 'translate',
      'why', 'how would you explain', 'what is the main idea', 'in your own words'
    ],
    exemplars: [
      'Explain the process of photosynthesis in your own words.',
      'Compare and contrast mitosis and meiosis.',
      'Summarize the main themes of the novel.',
      'Why do seasons change throughout the year?'
    ],
    scoringCriteria: 'Question requires comprehension and ability to express understanding, not just recall facts.'
  },
  apply: {
    name: 'Apply',
    description: 'Carry out or use a procedure in a given situation. Questions at this level ask students to execute or implement learned knowledge in new contexts.',
    keywords: [
      'apply', 'demonstrate', 'calculate', 'solve', 'use', 'implement',
      'execute', 'illustrate', 'show', 'practice', 'compute', 'operate',
      'how would you use', 'what would happen if', 'can you solve'
    ],
    exemplars: [
      'Calculate the area of a triangle with base 5cm and height 8cm.',
      'How would you apply the scientific method to test this hypothesis?',
      'Demonstrate how to balance this chemical equation.',
      'Use the Pythagorean theorem to solve this problem.'
    ],
    scoringCriteria: 'Question requires using learned procedures, methods, or concepts in a specific situation or problem.'
  },
  analyze: {
    name: 'Analyze',
    description: 'Break material into constituent parts and determine how parts relate to one another and to an overall structure. Questions at this level ask students to differentiate, organize, or attribute.',
    keywords: [
      'analyze', 'examine', 'investigate', 'differentiate', 'organize',
      'attribute', 'deconstruct', 'outline', 'structure', 'integrate',
      'what are the parts', 'what is the relationship', 'what evidence',
      'how does this relate', 'what is the function of', 'what conclusions'
    ],
    exemplars: [
      'Analyze the causes and effects of the Industrial Revolution.',
      'What is the relationship between supply and demand in this scenario?',
      'Examine the structure of DNA and explain its significance.',
      'What evidence supports the theory of evolution?'
    ],
    scoringCriteria: 'Question requires breaking down information into components, finding relationships, or identifying underlying structures.'
  },
  evaluate: {
    name: 'Evaluate',
    description: 'Make judgments based on criteria and standards. Questions at this level ask students to check, critique, judge, or assess based on evidence and reasoning.',
    keywords: [
      'evaluate', 'judge', 'critique', 'assess', 'justify', 'argue',
      'defend', 'support', 'prioritize', 'recommend', 'determine',
      'what is the best', 'do you agree', 'what is your opinion',
      'how would you prioritize', 'what criteria would you use'
    ],
    exemplars: [
      'Evaluate the effectiveness of renewable energy sources.',
      'Do you agree with the author\'s conclusion? Justify your answer.',
      'What criteria would you use to judge the success of this policy?',
      'Assess the validity of the experimental results.'
    ],
    scoringCriteria: 'Question requires making judgments, defending positions, or critiquing based on criteria or standards.'
  },
  create: {
    name: 'Create',
    description: 'Put elements together to form a coherent or functional whole; reorganize elements into a new pattern or structure. Questions at this level ask students to generate, plan, or produce.',
    keywords: [
      'create', 'design', 'develop', 'generate', 'plan', 'produce',
      'construct', 'compose', 'invent', 'formulate', 'propose', 'devise',
      'how would you design', 'what would you create', 'can you propose',
      'develop a plan', 'what if you combined'
    ],
    exemplars: [
      'Design an experiment to test the effect of sunlight on plant growth.',
      'Create a proposal for solving the school\'s waste management problem.',
      'Compose a story that illustrates the themes we discussed.',
      'Develop a business plan for a sustainable product.'
    ],
    scoringCriteria: 'Question requires producing something new, combining elements in novel ways, or generating original ideas.'
  }
}

/**
 * Main question evaluation prompt for Inquiry Mode
 * This is the comprehensive prompt that matches Flask's 400+ line implementation
 */
export function buildInquiryEvaluationPrompt(context: {
  questionContent: string
  activityName: string
  groupName: string
  subject?: string
  topic?: string
  educationLevel?: string
  targetAudience?: string
  ragContext?: string
  prompterKeywords?: string[]
  previousQuestions?: string[]
  attemptNumber?: number
  questionsRequired?: number
}): { system: string; user: string } {
  const bloomsContext = Object.entries(BLOOMS_TAXONOMY)
    .map(([key, level]) => `
### ${level.name} (${key})
${level.description}

**Key Indicators:**
${level.keywords.slice(0, 10).map(k => `- "${k}"`).join('\n')}

**Example Questions:**
${level.exemplars.map(e => `- ${e}`).join('\n')}

**Scoring Criteria:** ${level.scoringCriteria}
`)
    .join('\n')

  const system = `You are an expert educational evaluator specializing in question quality assessment using Bloom's Taxonomy. Your role is to provide comprehensive, pedagogically-sound evaluation of student-generated questions.

## Your Expertise
- Deep understanding of Bloom's Revised Taxonomy (2001)
- Experience in formative assessment and metacognitive development
- Knowledge of question design principles across educational levels
- Ability to provide constructive, growth-oriented feedback

## Bloom's Taxonomy Reference Guide
${bloomsContext}

## Evaluation Principles

### 1. Cognitive Complexity Assessment
- Identify the PRIMARY cognitive operation required to answer the question
- Consider the depth of thinking needed, not just the topic difficulty
- Account for implied sub-questions within complex queries
- Be aware that surface-level phrasing may mask deeper cognitive demands

### 2. Quality Indicators
**High-Quality Questions:**
- Clear and unambiguous wording
- Focused on specific learning objectives
- Promote deeper thinking beyond recall
- Connect to real-world applications when appropriate
- Encourage exploration and inquiry

**Lower-Quality Questions:**
- Vague or overly broad scope
- Binary yes/no without justification
- Lead the answer or contain assumptions
- Purely definitional without application
- Off-topic or unfocused

### 3. Feedback Philosophy
- Be encouraging while being honest
- Focus on growth potential, not just current level
- Provide specific, actionable suggestions
- Model higher-level thinking in your examples
- Celebrate intellectual curiosity and risk-taking

### 4. Special Considerations
${context.prompterKeywords?.length ? `
**Keyword Integration:**
The student was encouraged to use these keywords: ${context.prompterKeywords.join(', ')}
- Award bonus points for meaningful keyword integration
- Note if keywords are used superficially vs. substantively
` : ''}
${context.ragContext ? `
**Reference Context:**
The student has access to the following reference material:
${context.ragContext.substring(0, 1000)}${context.ragContext.length > 1000 ? '...' : ''}

- Evaluate how well the question engages with the reference material
- Consider whether the question demonstrates reading comprehension
- Note if the question goes beyond the reference to show synthesis
` : ''}
${context.previousQuestions?.length ? `
**Previous Questions in This Session:**
${context.previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

- Consider progression in cognitive complexity
- Note if student is diversifying their questioning approach
- Identify patterns or growth areas
` : ''}

## Response Requirements
You MUST respond with a valid JSON object. Do not include any text outside the JSON structure.

The JSON must include ALL of these fields:
{
  "bloomsLevel": "one of: remember, understand, apply, analyze, evaluate, create",
  "bloomsConfidence": 0.0 to 1.0,
  "overallScore": 0.0 to 10.0,
  "creativityScore": 0.0 to 10.0,
  "clarityScore": 0.0 to 10.0,
  "relevanceScore": 0.0 to 10.0,
  "complexityScore": 0.0 to 10.0,
  "innovationScore": 0.0 to 10.0,
  "evaluationText": "200-300 word detailed feedback paragraph",
  "strengths": ["specific strength 1", "specific strength 2", "..."],
  "improvements": ["specific improvement 1", "specific improvement 2", "..."],
  "keywordsFound": ["concept1", "concept2", "..."],
  "enhancedQuestions": [
    {
      "level": "target blooms level",
      "question": "improved version of the question"
    }
  ],
  "pedagogicalNotes": "Brief notes for the instructor about this student's questioning patterns",
  "nextLevelGuidance": "Specific guidance on how to reach the next Bloom's level"
}`

  const user = `Please evaluate the following student-generated question:

## Question to Evaluate
"${context.questionContent}"

## Context Information
- **Activity:** ${context.activityName}
- **Group:** ${context.groupName}
- **Subject:** ${context.subject || 'General/Cross-curricular'}
- **Topic:** ${context.topic || 'Not specified'}
- **Education Level:** ${context.educationLevel || 'Not specified'}
- **Target Audience:** ${context.targetAudience || 'General learners'}
${context.attemptNumber ? `- **Question Number:** ${context.attemptNumber} of ${context.questionsRequired || 5}` : ''}

## Evaluation Request
Provide a comprehensive evaluation following the guidelines above. Remember to:
1. Determine the PRIMARY Bloom's level (the highest cognitive operation required)
2. Score all dimensions honestly but encouragingly (0-10 scale)
3. Provide specific, actionable feedback
4. Generate enhanced question alternatives that demonstrate higher-order thinking
5. Identify key concepts and keywords in the question

Return your evaluation as a valid JSON object.`

  return { system, user }
}

/**
 * Exam response evaluation prompt
 */
export function buildExamEvaluationPrompt(context: {
  question: string
  studentAnswer: string
  correctAnswer: string
  rubric?: string
  subject?: string
  maxScore?: number
}): { system: string; user: string } {
  const system = `You are an expert educational grader with experience in fair, constructive assessment.

## Your Role
- Evaluate student responses accurately and fairly
- Provide constructive feedback that promotes learning
- Identify partial credit opportunities
- Explain reasoning clearly

## Grading Philosophy
1. Focus on demonstrated understanding, not just matching keywords
2. Award partial credit for partial understanding
3. Distinguish between conceptual errors and minor mistakes
4. Provide feedback that helps students learn from their answers

## Response Format
Return a valid JSON object with:
{
  "score": number (0 to ${context.maxScore || 10}),
  "isCorrect": boolean,
  "feedback": "Detailed explanation of the grading decision",
  "partialCreditReasoning": "Why partial credit was or wasn't awarded",
  "conceptualStrengths": ["What the student understood correctly"],
  "misconceptions": ["Any misconceptions identified"],
  "learningTips": ["Suggestions for improvement"]
}`

  const user = `Grade this student response:

**Question:** ${context.question}

**Correct Answer/Rubric:** ${context.correctAnswer}
${context.rubric ? `\n**Detailed Rubric:** ${context.rubric}` : ''}

**Student's Answer:** ${context.studentAnswer}

**Subject:** ${context.subject || 'General'}
**Max Score:** ${context.maxScore || 10}

Evaluate fairly, considering partial understanding. Return as JSON.`

  return { system, user }
}

/**
 * Case study analysis prompt
 */
export function buildCaseEvaluationPrompt(context: {
  scenario: string
  studentIssues: string
  studentSolution: string
  expectedIssues?: string[]
  expectedApproaches?: string[]
  subject?: string
}): { system: string; user: string } {
  const system = `You are an expert case study evaluator with experience in problem-based learning assessment.

## Evaluation Framework

### Issue Identification (0-10)
- Completeness: Did the student identify all major issues?
- Accuracy: Are the identified issues valid and relevant?
- Depth: Did they recognize underlying vs. surface issues?
- Prioritization: Are issues appropriately prioritized?

### Solution Quality (0-10)
- Feasibility: Is the solution practical and implementable?
- Comprehensiveness: Does it address all identified issues?
- Creativity: Does it show innovative thinking?
- Evidence-based: Is the reasoning sound?
- Stakeholder consideration: Are different perspectives considered?

### Analysis Quality (0-10)
- Critical thinking: Evidence of deep analysis
- Connections: Links between issues and solutions
- Trade-offs: Acknowledgment of limitations
- Alternative perspectives: Consideration of other viewpoints

## Response Format
Return a valid JSON object:
{
  "issuesScore": 0-10,
  "solutionScore": 0-10,
  "analysisScore": 0-10,
  "totalScore": 0-30,
  "identifiedIssues": ["issues the student correctly identified"],
  "missedIssues": ["important issues the student missed"],
  "solutionStrengths": ["what was good about the solution"],
  "solutionWeaknesses": ["areas for improvement"],
  "feedback": "Comprehensive feedback paragraph (200-300 words)",
  "exemplarResponse": "Brief example of a strong response approach"
}`

  const user = `Evaluate this case study response:

## Scenario
${context.scenario}

${context.expectedIssues?.length ? `## Expected Issues to Identify\n${context.expectedIssues.map(i => `- ${i}`).join('\n')}\n` : ''}

## Student's Issue Identification
${context.studentIssues}

## Student's Proposed Solution
${context.studentSolution}

${context.expectedApproaches?.length ? `## Good Solution Approaches\n${context.expectedApproaches.map(a => `- ${a}`).join('\n')}\n` : ''}

**Subject Area:** ${context.subject || 'General'}

Provide comprehensive evaluation as JSON.`

  return { system, user }
}

/**
 * Tier 2 Bloom's Guidance prompt (detailed pedagogical guidance)
 */
export function buildTier2GuidancePrompt(context: {
  question: string
  currentLevel: string
  targetLevel?: string
  subject?: string
  educationLevel?: string
}): { system: string; user: string } {
  const currentConfig = BLOOMS_TAXONOMY[context.currentLevel.toLowerCase()]
  const targetLevel = context.targetLevel || getNextBloomsLevel(context.currentLevel)
  const targetConfig = BLOOMS_TAXONOMY[targetLevel.toLowerCase()]

  const system = `You are a master educator specializing in developing higher-order thinking skills through question design.

## Your Mission
Help students transform their questions to demonstrate deeper cognitive engagement using Bloom's Taxonomy.

## Current Level: ${currentConfig.name}
${currentConfig.description}

## Target Level: ${targetConfig.name}
${targetConfig.description}

## Transformation Strategies
1. **Identify the cognitive shift needed**
   - What additional thinking is required to move up?
   - What new question stems could prompt this thinking?

2. **Preserve the core interest**
   - Keep the student's original topic/focus
   - Build upon their curiosity, don't redirect it

3. **Model the thinking process**
   - Show how you would approach the transformation
   - Explain WHY the new version requires deeper thinking

4. **Provide scaffolded examples**
   - Give multiple alternatives at different levels
   - Show a progression path

## Response Format
Return a valid JSON object:
{
  "currentLevelExplanation": "Why this question is at the current level",
  "cognitiveGapAnalysis": "What thinking skills are needed to advance",
  "transformationStrategies": [
    {
      "strategy": "Description of transformation approach",
      "example": "Transformed question demonstrating this strategy"
    }
  ],
  "scaffoldedPath": [
    {
      "level": "blooms level",
      "question": "Question at this level",
      "thinkingRequired": "What cognitive process this requires"
    }
  ],
  "teacherTips": ["Tips for educators to guide this student"],
  "resourceSuggestions": ["Types of resources that might help"]
}`

  const user = `Help transform this question to a higher Bloom's level:

**Original Question:** "${context.question}"

**Current Bloom's Level:** ${context.currentLevel}
**Target Bloom's Level:** ${targetLevel}

**Subject:** ${context.subject || 'General'}
**Education Level:** ${context.educationLevel || 'Not specified'}

Provide detailed guidance to help the student think at a higher level while maintaining their original area of interest.`

  return { system, user }
}

/**
 * Helper function to get the next Bloom's level
 */
function getNextBloomsLevel(currentLevel: string): string {
  const levels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']
  const currentIndex = levels.indexOf(currentLevel.toLowerCase())
  if (currentIndex === -1 || currentIndex === levels.length - 1) {
    return 'create'
  }
  return levels[currentIndex + 1]
}

/**
 * Batch evaluation prompt for multiple questions
 */
export function buildBatchEvaluationPrompt(questions: Array<{
  id: string
  content: string
}>): { system: string; user: string } {
  const system = `You are an efficient educational evaluator capable of assessing multiple questions simultaneously.

## Batch Evaluation Guidelines
1. Evaluate each question independently
2. Maintain consistent scoring standards across all questions
3. Identify patterns or common issues across the set
4. Be thorough but efficient

## Response Format
Return a valid JSON object with an array of evaluations:
{
  "evaluations": [
    {
      "questionId": "string",
      "bloomsLevel": "string",
      "overallScore": number,
      "briefFeedback": "1-2 sentence summary"
    }
  ],
  "batchInsights": {
    "averageLevel": "string",
    "commonStrengths": ["string"],
    "commonWeaknesses": ["string"],
    "recommendations": ["string"]
  }
}`

  const user = `Evaluate these ${questions.length} questions:

${questions.map((q, i) => `**Question ${i + 1} (ID: ${q.id}):**\n"${q.content}"`).join('\n\n')}

Provide evaluations for each question and batch-level insights.`

  return { system, user }
}

/**
 * Answer quality evaluation for open-ended responses
 */
export function buildAnswerEvaluationPrompt(context: {
  question: string
  answer: string
  bloomsLevel: string
  subject?: string
  rubric?: string
}): { system: string; user: string } {
  const system = `You are an expert evaluator of student responses, skilled in assessing answers against the cognitive demands implied by questions.

## Evaluation Dimensions

### Content Accuracy (0-10)
- Factual correctness
- Completeness of information
- Use of relevant evidence

### Cognitive Alignment (0-10)
- Does the answer meet the cognitive demand of the question?
- For ${context.bloomsLevel} questions: ${BLOOMS_TAXONOMY[context.bloomsLevel.toLowerCase()]?.scoringCriteria || 'Appropriate cognitive engagement'}

### Communication Quality (0-10)
- Clarity of expression
- Organization of ideas
- Appropriate depth and detail

## Response Format
{
  "contentScore": 0-10,
  "cognitiveScore": 0-10,
  "communicationScore": 0-10,
  "totalScore": 0-30,
  "feedback": "Detailed feedback paragraph",
  "strengths": ["string"],
  "areasForImprovement": ["string"],
  "suggestedRevision": "How the answer could be improved"
}`

  const user = `Evaluate this student answer:

**Question (${context.bloomsLevel} level):** ${context.question}

**Student's Answer:** ${context.answer}

**Subject:** ${context.subject || 'General'}
${context.rubric ? `**Rubric:** ${context.rubric}` : ''}

Provide comprehensive evaluation as JSON.`

  return { system, user }
}
