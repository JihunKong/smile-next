/**
 * Database Seed Script
 *
 * Orchestrates all seeders to populate the database with test data.
 * Each seeder is in its own file under prisma/seeders/ for maintainability.
 *
 * Usage: npx prisma db seed
 *
 * Test Accounts Password: Test1234!
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

import {
  seedUsers,
  seedGroups,
  seedActivities,
  seedQuestions,
  seedGamification,
  seedSocial,
  seedAttempts,
} from './seeders'

const prisma = new PrismaClient()
const TEST_PASSWORD = 'Test1234!'

async function main() {
  console.log('🌱 Starting database seed...\n')

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12)

  // 1. Seed Users (admins, teachers, students)
  const users = await seedUsers(prisma, passwordHash)

  // 2. Seed Groups & Memberships
  const groups = await seedGroups(prisma, users)

  // 3. Seed Activities
  const activities = await seedActivities(prisma, groups, users.teachers)

  // 4. Seed Questions
  const questions = await seedQuestions(prisma, users, activities)

  // 5. Seed Gamification (preferences, streaks, levels, badges)
  await seedGamification(prisma, users)

  // 6. Seed Social (likes, comments)
  await seedSocial(prisma, users)

  // 7. Seed Attempts (exams, inquiries, cases, leaderboards)
  await seedAttempts(prisma, users, activities, questions)

  // Print Summary
  console.log('\n' + '='.repeat(60))
  console.log('🎉 Seeding Complete!')
  console.log('='.repeat(60))
  console.log('\nTest Accounts (Password: Test1234!):')
  console.log('\n📌 Administrators')
  console.log('   • superadmin@smile.test')
  console.log('   • admin@smile.test')
  console.log('\n📌 Teachers')
  console.log('   • teacher1@smile.test - John Smith (CS, Physics)')
  console.log('   • teacher2@smile.test - Jane Williams (English, Research)')
  console.log('   • teacher3@smile.test - Michael Chen (Math)')
  console.log('\n📌 Active Students (high engagement)')
  users.activeStudents.forEach((s) => console.log(`   • ${s.email}`))
  console.log('\n📌 Moderate Students (some activity)')
  users.moderateStudents.forEach((s) => console.log(`   • ${s.email}`))
  console.log('\n📌 New Students (minimal activity)')
  users.newStudents.forEach((s) => console.log(`   • ${s.email}`))
  console.log('\n📌 Groups')
  console.log('   • CS Intro (public)')
  console.log('   • Advanced Math (private, passcode: MATH2025)')
  console.log('   • English Literature (public)')
  console.log('   • Physics Lab (public)')
  console.log('   • Research Methods (private, passcode: GRAD2025)')
  console.log('   • Study Group 101 (public, student-created)')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
