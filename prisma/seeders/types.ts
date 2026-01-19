import { PrismaClient, User } from '@prisma/client'

export type PrismaClientType = PrismaClient

export interface StudentInfo {
  email: string
  user: User
  category: 'active' | 'moderate' | 'new'
}

export interface SeededUsers {
  superAdmin: User
  admin: User
  teachers: {
    teacher1: User
    teacher2: User
    teacher3: User
  }
  students: StudentInfo[]
  activeStudents: StudentInfo[]
  moderateStudents: StudentInfo[]
  newStudents: StudentInfo[]
}

export interface SeededGroups {
  csGroup: { id: string; name: string }
  mathGroup: { id: string; name: string }
  englishGroup: { id: string; name: string }
  physicsGroup: { id: string; name: string }
  researchGroup: { id: string; name: string }
  studyGroup: { id: string; name: string }
}

export interface SeededActivities {
  // CS Group
  openActivity: { id: string; name: string }
  examActivity: { id: string; name: string }
  inquiryActivity: { id: string; name: string }
  caseActivity: { id: string; name: string }
  // Math Group
  mathExamActivity: { id: string; name: string }
  mathCaseActivity: { id: string; name: string }
  // English Group
  englishOpenActivity: { id: string; name: string }
  englishInquiryActivity: { id: string; name: string }
  // Physics Group
  physicsInquiryActivity: { id: string; name: string }
  // Research Group
  researchCaseActivity: { id: string; name: string }
}

export interface SeededQuestions {
  csExamQuestionIds: string[]
  mathExamQuestionIds: string[]
  csOpenQuestionIds: string[]
  englishOpenQuestionIds: string[]
}
