import albedo from '@albedo-link/intent'
import { getNetwork, isConnected, requestAccess, signMessage } from '@stellar/freighter-api'
import {
  clearAuthSession,
  createAuthChallenge,
  getAuthIdentity,
  loadAuthSession,
  saveAuthSession,
  verifyAuthChallenge,
} from './api'

export const WALLET_SESSION_KEY = 'skillchain.wallet.session'

const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015'

export type WalletType = 'freighter' | 'albedo'

export type WalletConnection = {
  address: string
  network: string
  networkPassphrase: string
  walletType: WalletType
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }

  return fallback
}

function encodeSignature(value: string | Uint8Array) {
  if (typeof value === 'string') return value
  let binary = ''
  value.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function saveWalletConnection(connection: WalletConnection) {
  sessionStorage.setItem(WALLET_SESSION_KEY, JSON.stringify(connection))
}

async function requireFreighter() {
  const connection = await isConnected()

  if (connection.error || !connection.isConnected) {
    throw new Error('Freighter is not available. Install or unlock the Freighter browser extension to continue.')
  }
}

async function readFreighterConnection(address: string): Promise<WalletConnection> {
  const networkResult = await getNetwork()

  if (networkResult.error) {
    throw new Error(getErrorMessage(networkResult.error, 'Unable to read the active Stellar network.'))
  }

  return {
    address,
    network: networkResult.network,
    networkPassphrase: networkResult.networkPassphrase,
    walletType: 'freighter',
  }
}

export async function connectFreighter(): Promise<WalletConnection> {
  await requireFreighter()
  const accessResult = await requestAccess()

  if (accessResult.error || !accessResult.address) {
    throw new Error(getErrorMessage(accessResult.error, 'Wallet access was declined. Please approve the request in Freighter.'))
  }

  return readFreighterConnection(accessResult.address)
}

export async function connectAlbedo(): Promise<WalletConnection> {
  const result = await albedo.publicKey({
    token: crypto.randomUUID(),
    require_existing: false,
  })

  if (!result.pubkey) {
    throw new Error('Albedo did not return a Stellar public key.')
  }

  return {
    address: result.pubkey,
    network: 'TESTNET',
    networkPassphrase: TESTNET_PASSPHRASE,
    walletType: 'albedo',
  }
}

async function signConnectionMessage(connection: WalletConnection, message: string) {
  if (connection.walletType === 'albedo') {
    const result = await albedo.signMessage({
      message,
      pubkey: connection.address,
    })
    return result.message_signature
  }

  const result = await signMessage(message, {
    address: connection.address,
    networkPassphrase: connection.networkPassphrase,
  })

  if (result.error || !result.signedMessage) {
    throw new Error(getErrorMessage(result.error, 'The authentication signature was declined.'))
  }

  return encodeSignature(result.signedMessage)
}

export async function authenticateWallet(connection: WalletConnection) {
  const challenge = await createAuthChallenge(
    connection.address,
    connection.network,
    connection.walletType,
  )
  const signature = await signConnectionMessage(connection, challenge.message)
  const authSession = await verifyAuthChallenge(challenge.challenge_id, connection.address, signature)
  saveAuthSession(authSession)
  saveWalletConnection(connection)
  return connection
}

export async function restoreWalletSession(): Promise<WalletConnection | null> {
  const authSession = loadAuthSession()
  const savedConnection = sessionStorage.getItem(WALLET_SESSION_KEY)
  if (!authSession || !savedConnection) return null

  try {
    const connection = JSON.parse(savedConnection) as WalletConnection
    const identity = await getAuthIdentity()
    if (
      identity.wallet_address !== connection.address
      || identity.wallet_type !== connection.walletType
    ) {
      clearWalletSession()
      return null
    }
    return connection
  } catch {
    clearWalletSession()
    return null
  }
}

export function clearWalletSession() {
  sessionStorage.removeItem(WALLET_SESSION_KEY)
  clearAuthSession()
}

export function isTestnet(network: string) {
  return network.toLowerCase() === 'testnet'
}

export function shortenAddress(address: string) {
  if (address.length < 14) return address
  return `${address.slice(0, 6)}…${address.slice(-5)}`
}
