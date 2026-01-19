/**
 * User Seeder
 *
 * Creates test users with different roles:
 * - Super Admin & Admin
 * - 3 Teachers
 * - 15 Students (5 active, 5 moderate, 5 new)
 */

import { PrismaClientType, SeededUsers, StudentInfo } from './types'

const STUDENT_DATA = [
  // Active students - high engagement, streaks, badges
  { email: 'emma.johnson@smile.test', username: 'emma_j', firstName: 'Emma', lastName: 'Johnson', category: 'active' as const },
  { email: 'liam.kim@smile.test', username: 'liam_k', firstName: 'Liam', lastName: 'Kim', category: 'active' as const },
  { email: 'sophia.garcia@smile.test', username: 'sophia_g', firstName: 'Sophia', lastName: 'Garcia', category: 'active' as const },
  { email: 'noah.patel@smile.test', username: 'noah_p', firstName: 'Noah', lastName: 'Patel', category: 'active' as const },
  { email: 'olivia.nguyen@smile.test', username: 'olivia_n', firstName: 'Olivia', lastName: 'Nguyen', category: 'active' as const },
  // Moderate students - some activity
  { email: 'ethan.brown@smile.test', username: 'ethan_b', firstName: 'Ethan', lastName: 'Brown', category: 'moderate' as const },
  { email: 'ava.martinez@smile.test', username: 'ava_m', firstName: 'Ava', lastName: 'Martinez', category: 'moderate' as const },
  { email: 'mason.lee@smile.test', username: 'mason_l', firstName: 'Mason', lastName: 'Lee', category: 'moderate' as const },
  { email: 'isabella.wilson@smile.test', username: 'isabella_w', firstName: 'Isabella', lastName: 'Wilson', category: 'moderate' as const },
  { email: 'james.taylor@smile.test', username: 'james_t', firstName: 'James', lastName: 'Taylor', category: 'moderate' as const },
  // New students - minimal activity
  { email: 'mia.anderson@smile.test', username: 'mia_a', firstName: 'Mia', lastName: 'Anderson', category: 'new' as const },
  { email: 'benjamin.thomas@smile.test', username: 'benjamin_t', firstName: 'Benjamin', lastName: 'Thomas', category: 'new' as const },
  { email: 'charlotte.jackson@smile.test', username: 'charlotte_j', firstName: 'Charlotte', lastName: 'Jackson', category: 'new' as const },
  { email: 'lucas.white@smile.test', username: 'lucas_w', firstName: 'Lucas', lastName: 'White', category: 'new' as const },
  { email: 'amelia.harris@smile.test', username: 'amelia_h', firstName: 'Amelia', lastName: 'Harris', category: 'new' as const },
]

export async function seedUsers(prisma: PrismaClientType, passwordHash: string): Promise<SeededUsers> {
  console.log('\n📦 Seeding Users...')

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@smile.test' },
    update: {},
    create: {
      email: 'superadmin@smile.test',
      username: 'superadmin',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: 0,
      emailVerified: true,
    },
  })
  console.log('  ✓ Created superadmin:', superAdmin.email)

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smile.test' },
    update: {},
    create: {
      email: 'admin@smile.test',
      username: 'admin',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      roleId: 1,
      emailVerified: true,
    },
  })
  console.log('  ✓ Created admin:', admin.email)

  // Teachers
  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher1@smile.test' },
    update: {},
    create: {
      email: 'teacher1@smile.test',
      username: 'teacher1',
      passwordHash,
      firstName: 'John',
      lastName: 'Smith',
      roleId: 2,
      emailVerified: true,
    },
  })

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@smile.test' },
    update: {},
    create: {
      email: 'teacher2@smile.test',
      username: 'teacher2',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Williams',
      roleId: 2,
      emailVerified: true,
    },
  })

  const teacher3 = await prisma.user.upsert({
    where: { email: 'teacher3@smile.test' },
    update: {},
    create: {
      email: 'teacher3@smile.test',
      username: 'teacher3',
      passwordHash,
      firstName: 'Michael',
      lastName: 'Chen',
      roleId: 2,
      emailVerified: true,
    },
  })
  console.log('  ✓ Created 3 teachers')

  // Students
  const students: StudentInfo[] = []
  for (const data of STUDENT_DATA) {
    const student = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        username: data.username,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        roleId: 3,
        emailVerified: true,
      },
    })
    students.push({ email: student.email, user: student, category: data.category })
  }
  console.log('  ✓ Created 15 students (5 active, 5 moderate, 5 new)')

  return {
    superAdmin,
    admin,
    teachers: { teacher1, teacher2, teacher3 },
    students,
    activeStudents: students.filter((s) => s.category === 'active'),
    moderateStudents: students.filter((s) => s.category === 'moderate'),
    newStudents: students.filter((s) => s.category === 'new'),
  }
}
