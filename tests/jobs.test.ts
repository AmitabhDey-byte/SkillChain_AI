import assert from 'node:assert/strict'
import test from 'node:test'
import { filterJobVacancies, jobVacancies } from '../src/data/jobs.ts'

test('provides fifty unique demo vacancies', () => {
  assert.equal(jobVacancies.length, 50)
  assert.equal(new Set(jobVacancies.map((job) => job.id)).size, 50)
})

test('searches across roles, clients, skills, and locations', () => {
  assert.ok(filterJobVacancies(jobVacancies, 'Soroban', 'All modes', 'All types').length > 0)
  assert.ok(filterJobVacancies(jobVacancies, 'NovaLedger', 'All modes', 'All types').length > 0)
  assert.ok(filterJobVacancies(jobVacancies, 'Bengaluru', 'All modes', 'All types').length > 0)
})

test('combines work mode and engagement filters', () => {
  const matches = filterJobVacancies(jobVacancies, '', 'Hybrid', 'Contract')
  assert.ok(matches.length > 0)
  assert.ok(matches.every((job) => job.workMode === 'Hybrid' && job.engagement === 'Contract'))
})
