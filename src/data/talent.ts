export type TalentProfile = {
  id: string
  name: string
  initials: string
  headline: string
  role: 'Developer' | 'Freelancer'
  location: string
  skills: string[]
  score: number
  availability: string
  rate: string
  verified: boolean
}

const firstNames = ['Aisha', 'Daniel', 'Maya', 'Ibrahim', 'Sofia', 'Arjun', 'Nia', 'Leo', 'Fatima', 'Noah']
const lastNames = ['Kapoor', 'Mensah', 'Chen', 'Okafor', 'Martinez', 'Rao', 'Williams', 'Schmidt', 'Hassan', 'Kim']
const specialties = [
  { headline: 'Soroban smart contract engineer', skills: ['Rust', 'Soroban', 'Stellar'] },
  { headline: 'Full-stack product developer', skills: ['React', 'FastAPI', 'PostgreSQL'] },
  { headline: 'Frontend systems specialist', skills: ['React', 'TypeScript', 'Accessibility'] },
  { headline: 'AI integration engineer', skills: ['Python', 'Gemini', 'RAG'] },
  { headline: 'Blockchain infrastructure developer', skills: ['Rust', 'Testing', 'CI/CD'] },
  { headline: 'Web3 product designer and developer', skills: ['React', 'UX', 'Web3'] },
  { headline: 'Backend API and data engineer', skills: ['Python', 'SQL', 'Analytics'] },
  { headline: 'Developer relations engineer', skills: ['JavaScript', 'APIs', 'Technical Writing'] },
  { headline: 'Mobile and payments developer', skills: ['React Native', 'Stellar', 'Payments'] },
  { headline: 'Cloud platform freelancer', skills: ['Docker', 'PostgreSQL', 'FastAPI'] },
]
const locations = ['Bengaluru, India', 'Accra, Ghana', 'Singapore', 'Lagos, Nigeria', 'Madrid, Spain', 'Pune, India', 'London, UK', 'Berlin, Germany', 'Dubai, UAE', 'Seoul, South Korea']

export const talentProfiles: TalentProfile[] = Array.from({ length: 50 }, (_, index) => {
  const firstName = firstNames[index % firstNames.length]
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length]
  const specialty = specialties[index % specialties.length]

  return {
    id: `talent-${String(index + 1).padStart(2, '0')}`,
    name: `${firstName} ${lastName}`,
    initials: `${firstName[0]}${lastName[0]}`,
    headline: specialty.headline,
    role: index % 3 === 0 ? 'Freelancer' : 'Developer',
    location: locations[index % locations.length],
    skills: specialty.skills,
    score: 72 + (index * 7) % 27,
    availability: index % 4 === 0 ? 'Available now' : index % 4 === 1 ? 'Available in 1 week' : 'Open to offers',
    rate: index % 3 === 0 ? `$${35 + (index % 6) * 10}/hr` : 'Full-time',
    verified: index % 6 !== 5,
  }
})

export function searchTalent(query: string, skill = 'All skills') {
  const normalized = query.trim().toLowerCase()
  return talentProfiles.filter((profile) => {
    const searchable = [profile.name, profile.headline, profile.role, profile.location, ...profile.skills].join(' ').toLowerCase()
    const matchesQuery = !normalized || searchable.includes(normalized)
    const matchesSkill = skill === 'All skills' || profile.skills.includes(skill)
    return matchesQuery && matchesSkill
  })
}
