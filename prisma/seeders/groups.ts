/**
 * Groups Seeder
 *
 * Creates test groups:
 * - 3 Public groups (CS, English, Physics, Study Group)
 * - 2 Private groups (Math, Research Methods)
 */

import { PrismaClientType, SeededUsers, SeededGroups } from './types'
import { daysAgo } from './utils'

export async function seedGroups(prisma: PrismaClientType, users: SeededUsers): Promise<SeededGroups> {
  console.log('\n📦 Seeding Groups...')

  const { teachers, activeStudents, moderateStudents, newStudents } = users

  // Create Groups
  const csGroup = await prisma.group.upsert({
    where: { id: 'cs-intro-group' },
    update: {},
    create: {
      id: 'cs-intro-group',
      creatorId: teachers.teacher1.id,
      name: 'Introduction to Computer Science',
      description: 'A beginner-friendly course covering programming fundamentals, algorithms, and data structures.',
      groupType: 'StudentPaced',
      isPrivate: false,
      requirePasscode: false,
    },
  })

  const mathGroup = await prisma.group.upsert({
    where: { id: 'advanced-math-group' },
    update: {},
    create: {
      id: 'advanced-math-group',
      creatorId: teachers.teacher3.id,
      name: 'Advanced Mathematics',
      description: 'Advanced topics including calculus, linear algebra, and differential equations.',
      groupType: 'StudentPaced',
      isPrivate: true,
      requirePasscode: true,
      passcode: 'MATH2025',
    },
  })

  const englishGroup = await prisma.group.upsert({
    where: { id: 'english-lit-group' },
    update: {},
    create: {
      id: 'english-lit-group',
      creatorId: teachers.teacher2.id,
      name: 'English Literature',
      description: 'Explore classic and contemporary literature through critical analysis and discussion.',
      groupType: 'StudentPaced',
      isPrivate: false,
      requirePasscode: false,
    },
  })

  const physicsGroup = await prisma.group.upsert({
    where: { id: 'physics-lab-group' },
    update: {},
    create: {
      id: 'physics-lab-group',
      creatorId: teachers.teacher1.id,
      name: 'Physics Lab',
      description: 'Hands-on physics experiments and inquiry-based learning.',
      groupType: 'StudentPaced',
      isPrivate: false,
      requirePasscode: false,
    },
  })

  const researchGroup = await prisma.group.upsert({
    where: { id: 'research-methods-group' },
    update: {},
    create: {
      id: 'research-methods-group',
      creatorId: teachers.teacher2.id,
      name: 'Research Methods Seminar',
      description: 'Graduate-level seminar on research methodologies, ethics, and academic writing.',
      groupType: 'StudentPaced',
      isPrivate: true,
      requirePasscode: true,
      passcode: 'GRAD2025',
    },
  })

  const studyGroup = await prisma.group.upsert({
    where: { id: 'study-group-101' },
    update: {},
    create: {
      id: 'study-group-101',
      creatorId: activeStudents[0].user.id,
      name: 'Study Group 101',
      description: 'Student-run study group for collaborative learning and peer tutoring.',
      groupType: 'StudentPaced',
      isPrivate: false,
      requirePasscode: false,
    },
  })

  console.log('  ✓ Created 6 groups (4 public, 2 private)')

  // Add Memberships
  await seedGroupMemberships(prisma, users, {
    csGroup,
    mathGroup,
    englishGroup,
    physicsGroup,
    researchGroup,
    studyGroup,
  })

  return { csGroup, mathGroup, englishGroup, physicsGroup, researchGroup, studyGroup }
}

async function seedGroupMemberships(
  prisma: PrismaClientType,
  users: SeededUsers,
  groups: SeededGroups
): Promise<void> {
  console.log('  → Adding group memberships...')

  const { teachers, activeStudents, moderateStudents, newStudents } = users
  const { csGroup, mathGroup, englishGroup, physicsGroup, researchGroup, studyGroup } = groups

  // Teacher memberships
  const teacherMemberships = [
    { userId: teachers.teacher1.id, groupId: csGroup.id, role: 2 },
    { userId: teachers.teacher1.id, groupId: physicsGroup.id, role: 2 },
    { userId: teachers.teacher2.id, groupId: englishGroup.id, role: 2 },
    { userId: teachers.teacher2.id, groupId: researchGroup.id, role: 2 },
    { userId: teachers.teacher3.id, groupId: mathGroup.id, role: 2 },
    { userId: teachers.teacher3.id, groupId: csGroup.id, role: 1 },
  ]

  for (const m of teacherMemberships) {
    await prisma.groupUser.upsert({
      where: { userId_groupId: { userId: m.userId, groupId: m.groupId } },
      update: {},
      create: m,
    })
  }

  // Active students: join multiple groups
  for (const student of activeStudents) {
    await prisma.groupUser.upsert({
      where: { userId_groupId: { userId: student.user.id, groupId: csGroup.id } },
      update: {},
      create: { userId: student.user.id, groupId: csGroup.id, role: 0 },
    })
    await prisma.groupUser.upsert({
      where: { userId_groupId: { userId: student.user.id, groupId: studyGroup.id } },
      update: {},
      create: { userId: student.user.id, groupId: studyGroup.id, role: 0 },
    })
  }

  // First 3 active students in Math
  for (let i = 0; i < 3; i++) {
    await prisma.groupUser.upsert({
      where: { userId_groupId: { userId: activeStudents[i].user.id, groupId: mathGroup.id } },
      update: {},
      create: { userId: activeStudents[i].user.id, groupId: mathGroup.id, role: 0 },
    })
  }

  // First 4 active students in English
  for (let i = 0; i < 4; i++) {
    await prisma.groupUser.upsert({
      where: { userId_groupId: { userId: activeStudents[i].user.id, groupId: englishGroup.id } },
      update: {},
      create: { userId: activeStudents[i].user.id, groupId: englishGroup.id, role: 0 },
    })
  }

  // Active students 2 and 3 in Physics
  await prisma.groupUser.upsert({
    where: { userId_groupId: { userId: activeStudents[1].user.id, groupId: physicsGroup.id } },
    update: {},
    create: { userId: activeStudents[1].user.id, groupId: physicsGroup.id, role: 0 },
  })
  await prisma.groupUser.upsert({
    where: { userId_groupId: { userId: activeStudents[2].user.id, groupId: physicsGroup.id } },
    update: {},
    create: { userId: activeStudents[2].user.id, groupId: physicsGroup.id, role: 0 },
  })

  // First 2 active students in Research
  for (let i = 0; i < 2; i++) {
    await prisma.groupUser.upsert({
      where: { userId_groupId: { userId: activeStudents[i].user.id, groupId: researchGroup.id } },
      update: {},
      create: { userId: activeStudents[i].user.id, groupId: researchGroup.id, role: 0 },
    })
  }

  // Study group creator is Co-Owner
  await prisma.groupUser.update({
    where: { userId_groupId: { userId: activeStudents[0].user.id, groupId: studyGroup.id } },
    data: { role: 2 },
  })

  // Moderate students: join 1-2 groups
  for (const student of moderateStudents) {
    await prisma.groupUser.upsert({
      where: { userId_groupId: { userId: student.user.id, groupId: csGroup.id } },
      update: {},
      create: { userId: student.user.id, groupId: csGroup.id, role: 0 },
    })
  }

  for (let i = 0; i < 3; i++) {
    await prisma.groupUser.upsert({
      where: { userId_groupId: { userId: moderateStudents[i].user.id, groupId: physicsGroup.id } },
      update: {},
      create: { userId: moderateStudents[i].user.id, groupId: physicsGroup.id, role: 0 },
    })
  }

  for (let i = 0; i < 2; i++) {
    await prisma.groupUser.upsert({
      where: { userId_groupId: { userId: moderateStudents[i].user.id, groupId: studyGroup.id } },
      update: {},
      create: { userId: moderateStudents[i].user.id, groupId: studyGroup.id, role: 0 },
    })
  }

  // New students: just CS
  for (const student of newStudents) {
    await prisma.groupUser.upsert({
      where: { userId_groupId: { userId: student.user.id, groupId: csGroup.id } },
      update: {},
      create: { userId: student.user.id, groupId: csGroup.id, role: 0, joinedAt: daysAgo(3) },
    })
  }

  console.log('  ✓ Added ~45 group memberships')
}
