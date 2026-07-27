import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [{
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    }, ...prev])
    setUnreadCount(prev => prev + 1)

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, dismissed: true } : n
        )
      )
    }, 5000)
  }, [])

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
    setUnreadCount(0)
  }, [])

  const clearDismissed = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.dismissed))
  }, [])

  // Cleanup dismissed notifications periodically
  useEffect(() => {
    const interval = setInterval(clearDismissed, 10000)
    return () => clearInterval(interval)
  }, [clearDismissed])

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllRead
  }
}