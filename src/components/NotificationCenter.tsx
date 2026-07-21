import { Bell, BriefcaseBusiness, CheckCheck, CircleAlert, CircleX, Eye, LoaderCircle, Sparkles, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationType,
  type SkillChainNotification,
} from '../lib/api'

type NotificationCenterProps = {
  walletAddress?: string
}

const notificationIcons: Record<NotificationType, typeof Eye> = {
  application_reviewing: Eye,
  application_shortlisted: Sparkles,
  application_declined: CircleX,
}

function relativeTime(value: string) {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  if (elapsedMinutes < 1) return 'Just now'
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`
  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours}h ago`
  return `${Math.floor(elapsedHours / 24)}d ago`
}

export function NotificationCenter({ walletAddress }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<SkillChainNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(Boolean(walletAddress))
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!walletAddress) return
    try {
      const response = await getNotifications(walletAddress, signal)
      setNotifications(response.notifications)
      setUnreadCount(response.unread_count)
      setError(null)
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') return
      setError(caughtError instanceof Error ? caughtError.message : 'Notifications could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    if (!walletAddress) return
    const controller = new AbortController()
    queueMicrotask(() => void load(controller.signal))
    const interval = window.setInterval(() => void load(), 30000)
    const refresh = () => void load()
    window.addEventListener('focus', refresh)
    return () => {
      controller.abort()
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
    }
  }, [load, walletAddress])

  const readOne = async (notification: SkillChainNotification) => {
    if (!walletAddress || notification.read_at) return
    try {
      const updated = await markNotificationRead(notification.id, walletAddress)
      setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item))
      setUnreadCount((current) => Math.max(0, current - 1))
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Notification could not be updated.')
    }
  }

  const readAll = async () => {
    if (!walletAddress || unreadCount === 0) return
    try {
      await markAllNotificationsRead(walletAddress)
      const readAt = new Date().toISOString()
      setNotifications((current) => current.map((item) => item.read_at ? item : { ...item, read_at: readAt }))
      setUnreadCount(0)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Notifications could not be updated.')
    }
  }

  return (
    <div className={open ? 'notification-center notification-center--open' : 'notification-center'}>
      <button className="notification-trigger" type="button" aria-label="Open notifications" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <Bell size={19} />
        {unreadCount > 0 && <span>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <section className="notification-panel" aria-label="Application notifications">
          <header><div><span><BriefcaseBusiness size={17} /></span><div><strong>Opportunity signals</strong><small>{unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'You are all caught up'}</small></div></div><button type="button" aria-label="Close notifications" onClick={() => setOpen(false)}><X size={17} /></button></header>
          {unreadCount > 0 && <button className="notification-read-all" type="button" onClick={() => void readAll()}><CheckCheck size={14} /> Mark all read</button>}
          <div className="notification-list">
            {loading ? <div className="notification-state"><LoaderCircle className="spin" /><strong>Loading your signals</strong></div> : error ? <div className="notification-state notification-state--error"><CircleAlert /><strong>Signals unavailable</strong><span>{error}</span><button type="button" onClick={() => void load()}>Try again</button></div> : notifications.length === 0 ? <div className="notification-state"><Bell /><strong>No application updates yet</strong><span>Recruiter decisions will appear here automatically.</span></div> : notifications.map((notification) => {
              const Icon = notificationIcons[notification.notification_type]
              return <button className={notification.read_at ? 'notification-item' : 'notification-item notification-item--unread'} type="button" key={notification.id} onClick={() => void readOne(notification)}><span className={`notification-item__icon notification-item__icon--${notification.notification_type}`}><Icon size={17} /></span><span><strong>{notification.title}</strong><span>{notification.message}</span><small>{relativeTime(notification.created_at)}</small></span>{!notification.read_at && <i />}</button>
            })}
          </div>
        </section>
      )}
    </div>
  )
}
