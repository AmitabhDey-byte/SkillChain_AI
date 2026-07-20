import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
const apiEntrypoint = readFileSync(new URL('../api/index.py', import.meta.url), 'utf8')

test('ships Vite and the FastAPI catch-all together', () => {
  assert.equal(config.framework, 'vite')
  assert.equal(config.buildCommand, 'npm run build')
  assert.equal(config.outputDirectory, 'dist')
  assert.equal(config.functions['api/**/*.py'].maxDuration, 60)
  assert.match(apiEntrypoint, /app = skillchain_app/)
})

test('keeps frontend rewrites away from API paths', () => {
  assert.ok(config.rewrites.every((rewrite: { source: string }) => !rewrite.source.startsWith('/api')))
})

test('restricts browser API connections to the same Vercel origin', () => {
  const policy = config.headers[0].headers.find((header: { key: string }) => header.key === 'Content-Security-Policy')
  assert.match(policy.value, /connect-src 'self';/)
})
