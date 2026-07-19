import { marketplaceCompanies } from './companies.ts'

export type JobVacancy = {
  id: string
  companyId: string
  title: string
  client: string
  clientInitials: string
  location: string
  workMode: 'Remote' | 'Hybrid' | 'On-site'
  engagement: 'Full-time' | 'Contract' | 'Freelance' | 'Internship'
  compensation: string
  skills: string[]
  summary: string
  postedDaysAgo: number
  verifiedClient: boolean
  stellarPayments: boolean
}

const roles = [
  { title: 'Frontend Engineer', skills: ['React', 'TypeScript', 'Vite'], summary: 'Build polished user workflows for a fast-growing developer platform.' },
  { title: 'Soroban Smart Contract Developer', skills: ['Rust', 'Soroban', 'Stellar'], summary: 'Develop and test secure on-chain workflows for Stellar applications.' },
  { title: 'Full-stack Product Engineer', skills: ['React', 'FastAPI', 'PostgreSQL'], summary: 'Own customer-facing features from interface design through backend delivery.' },
  { title: 'Backend API Engineer', skills: ['Python', 'FastAPI', 'PostgreSQL'], summary: 'Design reliable APIs and integrations for a distributed product team.' },
  { title: 'Web3 Developer Intern', skills: ['JavaScript', 'Stellar', 'Git'], summary: 'Learn by shipping production features with an experienced blockchain team.' },
  { title: 'AI Integration Engineer', skills: ['Python', 'Gemini', 'RAG'], summary: 'Create transparent AI workflows that turn technical evidence into insights.' },
  { title: 'React UI Developer', skills: ['React', 'CSS', 'Accessibility'], summary: 'Translate product designs into responsive and accessible interfaces.' },
  { title: 'Blockchain QA Engineer', skills: ['Testing', 'Rust', 'CI/CD'], summary: 'Build automated coverage for smart contracts and transaction workflows.' },
  { title: 'Developer Relations Engineer', skills: ['Technical Writing', 'JavaScript', 'APIs'], summary: 'Help developers succeed through examples, documentation, and workshops.' },
  { title: 'Data Platform Engineer', skills: ['Python', 'SQL', 'Analytics'], summary: 'Build trustworthy data pipelines and product analytics foundations.' },
]

const locations = ['Remote worldwide', 'Bengaluru, India', 'London, UK', 'Singapore', 'Berlin, Germany', 'New York, USA', 'Lagos, Nigeria', 'Toronto, Canada', 'Dubai, UAE', 'Remote, APAC']
const workModes: JobVacancy['workMode'][] = ['Remote', 'Hybrid', 'Remote', 'On-site', 'Remote']
const engagements: JobVacancy['engagement'][] = ['Full-time', 'Contract', 'Freelance', 'Full-time', 'Internship']
const compensations = ['$70k–$95k', '$4k–$7k / month', '$35–$60 / hour', '8k–14k XLM', '$1.5k–$3k milestone', '$90k–$125k']

export const jobVacancies: JobVacancy[] = Array.from({ length: 50 }, (_, index) => {
  const role = roles[index % roles.length]
  const company = marketplaceCompanies[index]

  return {
    id: `demo-job-${String(index + 1).padStart(2, '0')}`,
    companyId: company.id,
    title: role.title,
    client: company.name,
    clientInitials: company.initials,
    location: locations[index % locations.length],
    workMode: workModes[index % workModes.length],
    engagement: engagements[index % engagements.length],
    compensation: compensations[index % compensations.length],
    skills: role.skills,
    summary: role.summary,
    postedDaysAgo: (index % 12) + 1,
    verifiedClient: company.verified,
    stellarPayments: index % 3 !== 2,
  }
})

export function filterJobVacancies(
  jobs: JobVacancy[],
  query: string,
  workMode: string,
  engagement: string,
) {
  const normalizedQuery = query.trim().toLowerCase()
  return jobs.filter((job) => {
    const searchable = [job.title, job.client, job.location, job.summary, ...job.skills].join(' ').toLowerCase()
    const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery)
    const matchesMode = workMode === 'All modes' || job.workMode === workMode
    const matchesEngagement = engagement === 'All types' || job.engagement === engagement
    return matchesQuery && matchesMode && matchesEngagement
  })
}
