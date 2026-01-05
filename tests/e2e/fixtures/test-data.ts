/**
 * Test data constants for E2E tests
 */

export const TEST_PASSWORD = 'Test1234!'

export const TEST_USERS = {
  superAdmin: {
    email: 'superadmin@smile.test',
    password: TEST_PASSWORD,
    firstName: 'Super',
    lastName: 'Admin',
    role: 'Super Admin',
  },
  admin: {
    email: 'admin@smile.test',
    password: TEST_PASSWORD,
    firstName: 'Admin',
    lastName: 'User',
    role: 'Admin',
  },
  teacher1: {
    email: 'teacher1@smile.test',
    password: TEST_PASSWORD,
    firstName: 'John',
    lastName: 'Teacher',
    role: 'Teacher',
  },
  teacher2: {
    email: 'teacher2@smile.test',
    password: TEST_PASSWORD,
    firstName: 'Jane',
    lastName: 'Instructor',
    role: 'Teacher',
  },
  student1: {
    email: 'student1@smile.test',
    password: TEST_PASSWORD,
    firstName: 'Student',
    lastName: '1',
    role: 'Student',
  },
  student2: {
    email: 'student2@smile.test',
    password: TEST_PASSWORD,
    firstName: 'Student',
    lastName: '2',
    role: 'Student',
  },
  student3: {
    email: 'student3@smile.test',
    password: TEST_PASSWORD,
    firstName: 'Student',
    lastName: '3',
    role: 'Student',
  },
  student4: {
    email: 'student4@smile.test',
    password: TEST_PASSWORD,
    firstName: 'Student',
    lastName: '4',
    role: 'Student',
  },
} as const

export const TEST_GROUPS = {
  csIntro: {
    id: 'cs-intro-group',
    name: 'Introduction to Computer Science',
    description: 'A beginner-friendly course covering programming fundamentals.',
    isPrivate: false,
    requirePasscode: false,
  },
  advancedMath: {
    id: 'advanced-math-group',
    name: 'Advanced Mathematics',
    description: 'Advanced topics including calculus and linear algebra.',
    isPrivate: true,
    requirePasscode: true,
    passcode: '1234',
  },
  englishLit: {
    id: 'english-lit-group',
    name: 'English Literature',
    description: 'Explore classic and contemporary literature.',
    isPrivate: false,
    requirePasscode: false,
  },
} as const

export const TEST_ACTIVITIES = {
  openDiscussion: {
    id: 'open-discussion-activity',
    name: 'Open Discussion: Programming Basics',
    mode: 'open',
  },
  examDataStructures: {
    id: 'exam-data-structures',
    name: 'Midterm Exam: Data Structures',
    mode: 'exam',
    questionsCount: 5,
    timeLimit: 30,
    passThreshold: 60,
  },
  inquiryScientific: {
    id: 'inquiry-scientific-method',
    name: 'Scientific Method Inquiry',
    mode: 'inquiry',
    questionsRequired: 5,
    timePerQuestion: 240,
  },
  caseBusinessEthics: {
    id: 'case-business-ethics',
    name: 'Business Ethics Case Study',
    mode: 'case',
    scenarios: 2,
    timeLimit: 45,
  },
} as const

export function generateUniqueEmail(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `testuser_${timestamp}_${random}@test.com`
}

export function generateNewUser() {
  const email = generateUniqueEmail()
  return {
    email,
    password: TEST_PASSWORD,
    firstName: 'Test',
    lastName: 'User',
    role: 'Student',
  }
}
