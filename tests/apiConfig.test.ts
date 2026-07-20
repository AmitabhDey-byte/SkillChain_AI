import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveApiBaseUrl } from '../src/lib/apiConfig.ts'

test('uses the same-origin API path in production', () => {
  assert.equal(resolveApiBaseUrl(true, 'https://stale-api.example.com/api/v1'), '/api/v1')
})

test('uses the configured API URL in development', () => {
  assert.equal(resolveApiBaseUrl(false, 'http://localhost:8000/api/v1/'), 'http://localhost:8000/api/v1')
})

test('uses the Vite API proxy by default in development', () => {
  assert.equal(resolveApiBaseUrl(false), '/api/v1')
})
