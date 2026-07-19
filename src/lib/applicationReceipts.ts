export const APPLICATION_RECEIPTS_KEY = 'skillchain.marketplace.applicationReceipts'

export type ApplicationReceipt = {
  id: string
  jobId: string
  createdAt: string
}

export function loadApplicationReceipts() {
  const saved = localStorage.getItem(APPLICATION_RECEIPTS_KEY)
  if (!saved) return [] as ApplicationReceipt[]
  try {
    return JSON.parse(saved) as ApplicationReceipt[]
  } catch {
    return []
  }
}

export function saveApplicationReceipt(receipt: ApplicationReceipt) {
  const current = loadApplicationReceipts().filter((item) => item.jobId !== receipt.jobId)
  const next = [receipt, ...current]
  localStorage.setItem(APPLICATION_RECEIPTS_KEY, JSON.stringify(next))
  return next
}
