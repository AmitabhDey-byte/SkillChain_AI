import { getAddress, getNetwork, isConnected, requestAccess } from '@stellar/freighter-api'

export const WALLET_SESSION_KEY = 'skillchain.wallet.connected'

export type WalletConnection = {
  address: string
  network: string
  networkPassphrase: string
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }

  return fallback
}

async function requireFreighter() {
  const connection = await isConnected()

  if (connection.error || !connection.isConnected) {
    throw new Error('Freighter is not available. Install or unlock the Freighter browser extension to continue.')
  }
}

async function readConnection(address: string): Promise<WalletConnection> {
  const networkResult = await getNetwork()

  if (networkResult.error) {
    throw new Error(getErrorMessage(networkResult.error, 'Unable to read the active Stellar network.'))
  }

  return {
    address,
    network: networkResult.network,
    networkPassphrase: networkResult.networkPassphrase,
  }
}

export async function connectFreighter(): Promise<WalletConnection> {
  await requireFreighter()
  const accessResult = await requestAccess()

  if (accessResult.error || !accessResult.address) {
    throw new Error(getErrorMessage(accessResult.error, 'Wallet access was declined. Please approve the request in Freighter.'))
  }

  return readConnection(accessResult.address)
}

export async function restoreFreighterSession(): Promise<WalletConnection | null> {
  if (localStorage.getItem(WALLET_SESSION_KEY) !== 'true') return null

  await requireFreighter()
  const addressResult = await getAddress()

  if (addressResult.error || !addressResult.address) return null

  return readConnection(addressResult.address)
}

export function isTestnet(network: string) {
  return network.toLowerCase() === 'testnet'
}

export function shortenAddress(address: string) {
  if (address.length < 14) return address
  return `${address.slice(0, 6)}…${address.slice(-5)}`
}

