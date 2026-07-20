import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
const backendEntrypoint = readFileSync(new URL('../backend/main.py', import.meta.url), 'utf8')

test('ships Vite and FastAPI as routed services', () => {
  assert.equal(config.services.frontend.framework, 'vite')
  assert.equal(config.services.frontend.buildCommand, 'npm run build')
  assert.equal(config.services.frontend.outputDirectory, 'dist')
  assert.equal(config.services.backend.framework, 'fastapi')
  assert.equal(config.services.backend.entrypoint, 'main:app')
  assert.match(backendEntrypoint, /from backend\.app\.main import app/)
})

test('routes API traffic to the backend before the frontend catch-all', () => {
  assert.equal(config.rewrites[0].source, '/api/(.*)')
  assert.equal(config.rewrites[0].destination.service, 'backend')
  assert.equal(config.rewrites.at(-1).destination.service, 'frontend')
})

test('restricts browser API connections to the same Vercel origin', () => {
  const policy = config.headers[0].headers.find((header: { key: string }) => header.key === 'Content-Security-Policy')
  assert.match(policy.value, /connect-src 'self'/)
  assert.match(policy.value, /frame-src https:\/\/albedo\.link;/)
})
