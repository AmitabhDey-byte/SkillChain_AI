import { useCallback, useEffect, useState } from 'react'
import { recordWalletConnection } from '../lib/api'
import {
  authenticateWallet,
  clearWalletSession,
  connectAlbedo,
  connectFreighter,
  restoreWalletSession,
  type WalletConnection,
  type WalletType,
} from '../lib/wallet'

type WalletStatus = 'checking' | 'disconnected' | 'connecting' | 'connected' | 'error'

export function useWallet() {
  const [status, setStatus] = useState<WalletStatus>('checking')
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    restoreWalletSession()
      .then((savedConnection) => {
        if (!active) return
        setConnection(savedConnection)
        setStatus(savedConnection ? 'connected' : 'disconnected')
      })
      .catch(() => {
        if (!active) return
        clearWalletSession()
        setConnection(null)
        setStatus('disconnected')
      })

    return () => {
      active = false
    }
  }, [])

  const connect = useCallback(async (walletType: WalletType = 'freighter') => {
    setStatus('connecting')
    setError(null)

    try {
      const walletConnection = walletType === 'albedo'
        ? await connectAlbedo()
        : await connectFreighter()
      const nextConnection = await authenticateWallet(walletConnection)
      setConnection(nextConnection)
      setStatus('connected')
      void recordWalletConnection(nextConnection.address, nextConnection.network).catch(() => undefined)
      return true
    } catch (caughtError) {
      setConnection(null)
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to connect your wallet.')
      setStatus('error')
      return false
    }
  }, [])

  const disconnect = useCallback(() => {
    clearWalletSession()
    setConnection(null)
    setError(null)
    setStatus('disconnected')
  }, [])

  return { status, connection, error, connect, disconnect }
}
