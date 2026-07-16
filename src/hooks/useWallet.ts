import { useCallback, useEffect, useState } from 'react'
import {
  connectFreighter,
  restoreFreighterSession,
  WALLET_SESSION_KEY,
  type WalletConnection,
} from '../lib/wallet'

type WalletStatus = 'checking' | 'disconnected' | 'connecting' | 'connected' | 'error'

export function useWallet() {
  const [status, setStatus] = useState<WalletStatus>('checking')
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    restoreFreighterSession()
      .then((savedConnection) => {
        if (!active) return
        setConnection(savedConnection)
        setStatus(savedConnection ? 'connected' : 'disconnected')
      })
      .catch(() => {
        if (!active) return
        localStorage.removeItem(WALLET_SESSION_KEY)
        setConnection(null)
        setStatus('disconnected')
      })

    return () => {
      active = false
    }
  }, [])

  const connect = useCallback(async () => {
    setStatus('connecting')
    setError(null)

    try {
      const nextConnection = await connectFreighter()
      localStorage.setItem(WALLET_SESSION_KEY, 'true')
      setConnection(nextConnection)
      setStatus('connected')
      return true
    } catch (caughtError) {
      setConnection(null)
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to connect your wallet.')
      setStatus('error')
      return false
    }
  }, [])

  const disconnect = useCallback(() => {
    localStorage.removeItem(WALLET_SESSION_KEY)
    setConnection(null)
    setError(null)
    setStatus('disconnected')
  }, [])

  return { status, connection, error, connect, disconnect }
}
