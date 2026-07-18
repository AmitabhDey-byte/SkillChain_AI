const adminWallets = (import.meta.env.VITE_ADMIN_WALLETS || '')
  .split(',')
  .map((address: string) => address.trim().toUpperCase())
  .filter(Boolean)

export function isAdminWallet(address?: string | null) {
  return Boolean(address && adminWallets.includes(address.toUpperCase()))
}
