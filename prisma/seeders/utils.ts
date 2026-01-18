/**
 * Utility functions for seeding
 */

// Create dates relative to now
export const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)
export const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000)
export const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000)
