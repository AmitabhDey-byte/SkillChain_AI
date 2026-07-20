export function resolveApiBaseUrl(isProduction: boolean, configuredUrl?: string) {
  const baseUrl = isProduction ? '/api/v1' : configuredUrl?.trim() || '/api/v1'
  return baseUrl.replace(/\/$/, '')
}
