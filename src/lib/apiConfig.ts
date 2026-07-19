export function resolveApiBaseUrl(isProduction: boolean, configuredUrl?: string) {
  const baseUrl = isProduction ? '/api/v1' : configuredUrl || 'http://localhost:8000/api/v1'
  return baseUrl.replace(/\/$/, '')
}
