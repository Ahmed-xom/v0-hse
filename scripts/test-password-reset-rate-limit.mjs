import assert from 'node:assert/strict'

const MAX_REQUESTS = 3
const WINDOW_MINUTES = 12 * 60
const WINDOW_MS = WINDOW_MINUTES * 60 * 1000

function isRateLimited(createdAt, now) {
  return createdAt.filter(timestamp => timestamp > now - WINDOW_MS).length >= MAX_REQUESTS
}

const now = Date.parse('2026-10-12T12:00:00.000Z')
assert.equal(isRateLimited([now - 1, now - 2, now - 3], now), true, 'the fourth request is blocked after three requests')
assert.equal(isRateLimited([now - 1, now - 2], now), false, 'the first two requests remain allowed')
assert.equal(isRateLimited([now - WINDOW_MS - 1, now - WINDOW_MS - 2, now - WINDOW_MS - 3], now), false, 'requests older than 12 hours no longer count')
assert.equal(isRateLimited([now - WINDOW_MS + 1, now - WINDOW_MS + 2, now - WINDOW_MS + 3], now), true, 'requests inside the 12-hour window still count')

console.log('Password reset rate-limit tests passed: 3 requests per 720 minutes.')
