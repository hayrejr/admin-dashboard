// src/context/AdminContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

const AdminContext = createContext({})

export function AdminProvider({ children }) {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [coupons, setCoupons] = useState([])
  const [referrers, setReferrers] = useState([])
  const [settings, setSettings] = useState({})
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [notifications, setNotifications] = useState([])

  const fetchAllData = useCallback(async () => {
    try {
      setRefreshing(true)
      setError(null)

      const [statsData, usersData, ordersData, pendingData, couponsData, referrersData, settingsData, activityData] = 
        await Promise.all([
          api.getDashboardStats(),
          api.getUsers(100, 0),
          api.getOrders(50, 0),
          api.getPendingOrders(),
          api.getCoupons(),
          api.getTopReferrers(15),
          api.getSettings(),
          api.getActivityStats(7)
        ])

      setStats(statsData)
      setUsers(usersData)
      setOrders(ordersData)
      setPendingOrders(pendingData)
      setCoupons(couponsData)
      setReferrers(referrersData)
      setSettings(settingsData)
      setActivity(activityData)
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const refresh = useCallback(() => {
    api.invalidateCache()
    return fetchAllData()
  }, [fetchAllData])

  // Real-time subscriptions
  useEffect(() => {
    // Subscribe to new orders
    const ordersSub = api.subscribeToOrders((newOrder) => {
      setOrders(prev => [newOrder, ...prev])
      setPendingOrders(prev => {
        if (newOrder.status === 'pending') {
          return [newOrder, ...prev]
        }
        return prev
      })
      setNotifications(prev => [{
        id: Date.now(),
        type: 'order',
        title: '🆕 New Order',
        message: `Order #${newOrder.id} from ${newOrder.users?.username || 'User'}`,
        data: newOrder,
        read: false,
        timestamp: new Date().toISOString()
      }, ...prev])
    })

    // Subscribe to order updates
    const orderUpdatesSub = api.subscribeToOrderUpdates((updatedOrder) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
      setPendingOrders(prev => prev.filter(o => o.id !== updatedOrder.id))
      if (updatedOrder.status === 'pending') {
        setPendingOrders(prev => [updatedOrder, ...prev])
      }
      // Refresh stats
      api.getDashboardStats().then(setStats)
    })

    // Subscribe to new users
    const usersSub = api.subscribeToNewUsers((newUser) => {
      setUsers(prev => [newUser, ...prev])
      setNotifications(prev => [{
        id: Date.now(),
        type: 'user',
        title: '👤 New User',
        message: `${newUser.name || 'User'} started the bot`,
        data: newUser,
        read: false,
        timestamp: new Date().toISOString()
      }, ...prev])
      api.getDashboardStats().then(setStats)
    })

    return () => {
      ordersSub.unsubscribe()
      orderUpdatesSub.unsubscribe()
      usersSub.unsubscribe()
    }
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [refresh])

  // Initial load
  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const value = {
    stats,
    users,
    orders,
    pendingOrders,
    coupons,
    referrers,
    settings,
    activity,
    loading,
    refreshing,
    error,
    notifications,
    refresh,
    api,
    updateSetting: async (key, value) => {
      await api.updateSetting(key, value)
      setSettings(prev => ({ ...prev, [key]: value }))
    },
    updateOrderStatus: async (orderId, status, updates) => {
      await api.updateOrderStatus(orderId, status, updates)
      await refresh()
    },
    createCoupon: async (couponData) => {
      const newCoupon = await api.createCoupon(couponData)
      setCoupons(prev => [newCoupon, ...prev])
      return newCoupon
    },
    deleteCoupon: async (couponId) => {
      await api.deleteCoupon(couponId)
      setCoupons(prev => prev.filter(c => c.id !== couponId))
    },
    markNotificationRead: (id) => {
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ))
    },
    markAllNotificationsRead: () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    },
    clearNotifications: () => {
      setNotifications([])
    }
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }
  return context
}