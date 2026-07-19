export type MarketplaceCompany = {
  id: string
  name: string
  initials: string
  sector: string
  location: string
  description: string
  verified: boolean
  color: string
}

const companyNames = [
  'NovaLedger Labs',
  'OrbitPay',
  'DevHarbor',
  'Lumina Protocol',
  'ChainCraft Studio',
  'PixelMint',
  'AsterWorks',
  'OpenMesh Foundation',
  'BrightNode',
  'KiteStack',
  'CloudSprint',
  'Veridian Systems',
  'StellarBridge',
  'Northstar Digital',
  'Cobalt Finance',
  'BuildSphere',
  'QuantaGrid',
  'Atlas Freelance',
  'SignalForge',
  'LaunchDock',
  'MintRiver',
  'PrismStack',
  'HelioWorks',
  'TerraByte Labs',
  'ArcNova',
  'NexaCloud',
  'BlueOrbit Systems',
  'VectorMint',
  'CodeCanopy',
  'EmberPay',
  'Zenith Protocol',
  'Lattice Labs',
  'Moonrise Digital',
  'CopperLeaf',
  'Vertex Commerce',
  'Solace Systems',
  'Pioneer Chain',
  'RippleForge',
  'Quantum Harbor',
  'GreenBlock Labs',
  'Axiom Studio',
  'Vela Networks',
  'IonWorks',
  'Mosaic Finance',
  'PeakLayer',
  'CloudWeave',
  'Starling Labs',
  'OpalStack',
  'Foundry North',
  'CivicMesh',
]

const sectors = ['Payments', 'Developer tools', 'Web3 infrastructure', 'AI platforms', 'Fintech', 'Digital identity', 'Open source', 'Commerce']
const locations = ['Bengaluru, India', 'London, UK', 'Singapore', 'Berlin, Germany', 'New York, USA', 'Lagos, Nigeria', 'Toronto, Canada', 'Dubai, UAE', 'Remote, APAC', 'Remote worldwide']
const colors = ['#6f5cff', '#ff6b6b', '#00a878', '#f59e0b', '#168aad', '#b14aed', '#ef476f', '#3a86ff']

export const marketplaceCompanies: MarketplaceCompany[] = companyNames.map((name, index) => ({
  id: `company-${String(index + 1).padStart(2, '0')}`,
  name,
  initials: name.split(' ').map((word) => word[0]).join('').slice(0, 2),
  sector: sectors[index % sectors.length],
  location: locations[index % locations.length],
  description: `${name} builds trusted ${sectors[index % sectors.length].toLowerCase()} products for global teams using modern cloud and blockchain infrastructure.`,
  verified: index % 5 !== 4,
  color: colors[index % colors.length],
}))

export function searchCompanies(query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return marketplaceCompanies
  return marketplaceCompanies.filter((company) =>
    [company.name, company.sector, company.location, company.description].join(' ').toLowerCase().includes(normalized),
  )
}
