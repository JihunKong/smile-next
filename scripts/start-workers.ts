#!/usr/bin/env tsx
/**
 * Queue Worker Startup Script
 *
 * This script starts all background workers for processing AI evaluation jobs.
 * Run with: npm run workers
 *
 * Required environment variables:
 * - REDIS_URL: Redis connection URL
 * - ANTHROPIC_API_KEY: Claude AI API key
 * - DATABASE_URL: PostgreSQL connection URL
 */

import { startAllWorkers } from '../src/lib/queue/workers'

console.log('='.repeat(60))
console.log('SMILE Platform - Queue Workers')
console.log('='.repeat(60))
console.log('')

// Validate environment
const requiredEnvVars = ['REDIS_URL', 'ANTHROPIC_API_KEY', 'DATABASE_URL']
const missingVars = requiredEnvVars.filter((v) => !process.env[v])

if (missingVars.length > 0) {
  console.error('Missing required environment variables:')
  missingVars.forEach((v) => console.error(`  - ${v}`))
  console.error('')
  console.error('Please set these variables before starting workers.')
  process.exit(1)
}

console.log('Environment validated successfully')
console.log(`Redis URL: ${process.env.REDIS_URL?.replace(/:[^:@]+@/, ':***@')}`)
console.log('')

// Start workers
try {
  startAllWorkers()

  console.log('')
  console.log('Workers are running. Press Ctrl+C to stop.')
  console.log('='.repeat(60))

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('')
    console.log('Received SIGINT. Shutting down workers...')
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('')
    console.log('Received SIGTERM. Shutting down workers...')
    process.exit(0)
  })
} catch (error) {
  console.error('Failed to start workers:', error)
  process.exit(1)
}
