import assert from 'node:assert/strict'
import test from 'node:test'
import { marketplaceCompanies, searchCompanies } from '../src/data/companies.ts'
import { filterJobVacancies, jobVacancies } from '../src/data/jobs.ts'
import { mergeTalentProfiles, searchTalent, talentProfiles } from '../src/data/talent.ts'

test('provides fifty unique demo vacancies', () => {
  assert.equal(jobVacancies.length, 50)
  assert.equal(new Set(jobVacancies.map((job) => job.id)).size, 50)
  assert.equal(new Set(jobVacancies.map((job) => job.client)).size, 50)
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

test('provides fifty searchable companies', () => {
  assert.equal(marketplaceCompanies.length, 50)
  assert.equal(new Set(marketplaceCompanies.map((company) => company.id)).size, 50)
  assert.ok(searchCompanies('Payments').length > 0)
})

test('provides fifty skill-searchable talent profiles', () => {
  assert.equal(talentProfiles.length, 50)
  assert.equal(new Set(talentProfiles.map((profile) => profile.id)).size, 50)
  assert.ok(searchTalent('Soroban').length > 0)
  assert.ok(searchTalent('', 'React').every((profile) => profile.skills.includes('React')))
})

test('places registered SkillChain members before demo talent', () => {
  const profiles = mergeTalentProfiles([{
    id: '91c3262a-902b-4b14-a129-9913573b0bf2',
    wallet_address: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    role: 'talent',
    display_name: 'Live Builder',
    headline: 'Stellar protocol developer',
    location: 'Remote',
    organization: null,
    bio: null,
    avatar_url: null,
    github_username: 'live-builder',
    skills: ['Soroban'],
    onboarding_complete: true,
    created_at: '2026-07-20T00:00:00Z',
    updated_at: '2026-07-20T00:00:00Z',
  }])

  assert.equal(profiles[0].name, 'Live Builder')
  assert.equal(profiles[0].source, 'member')
  assert.equal(searchTalent('live-builder', 'All skills', profiles)[0].name, 'Live Builder')
})
