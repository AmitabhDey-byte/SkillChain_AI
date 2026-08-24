import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
const packageConfig = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const backendEntrypoint = readFileSync(new URL('../backend/main.py', import.meta.url), 'utf8')
const spaRouteGenerator = readFileSync(new URL('../scripts/generate-spa-routes.mjs', import.meta.url), 'utf8')

test('ships Vite and FastAPI as routed services', () => {
  assert.equal(config.services.frontend.framework, 'vite')
  assert.equal(config.services.frontend.buildCommand, undefined)
  assert.equal(config.services.frontend.outputDirectory, undefined)
  assert.equal(config.services.backend.framework, undefined)
  assert.equal(config.services.backend.entrypoint, 'main:app')
  assert.match(backendEntrypoint, /from backend\.app\.main import app/)
})

test('routes API traffic to the backend before the frontend catch-all', () => {
  assert.equal(config.rewrites[0].source, '/api/:path*')
  assert.equal(config.rewrites[0].destination.service, 'backend')
  assert.equal(config.rewrites.at(-1).destination.service, 'frontend')
})

test('emits static entrypoints for direct SPA navigation', () => {
  assert.match(packageConfig.scripts.build, /generate-spa-routes\.mjs/)
  for (const route of ['explore', 'dashboard', 'recruiter-dashboard', 'admin']) {
    assert.match(spaRouteGenerator, new RegExp(`['"]${route}['"]`))
  }
})

test('restricts browser API connections to the same Vercel origin', () => {
  const securityHeaders = config.headers.find((header: { source: string }) => header.source === '/(.*)')
  const policy = securityHeaders.headers.find((header: { key: string }) => header.key === 'Content-Security-Policy')
  assert.match(policy.value, /connect-src 'self'/)
  assert.match(policy.value, /script-src 'self' https:\/\/vercel\.live;/)
  assert.match(policy.value, /script-src-elem 'self' https:\/\/vercel\.live;/)
  assert.match(policy.value, /font-src 'self' https:\/\/fonts\.gstatic\.com https:\/\/vercel\.live;/)
  assert.match(policy.value, /frame-src https:\/\/albedo\.link https:\/\/vercel\.live;/)
})

test('caches immutable Vite assets for repeat visits', () => {
  const assets = config.headers.find((header: { source: string }) => header.source === '/assets/:path*')
  const cacheControl = assets.headers.find((header: { key: string }) => header.key === 'Cache-Control')

  assert.equal(cacheControl.value, 'public, max-age=31536000, immutable')
})
