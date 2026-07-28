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
  const [prices, setPrices] = useState({
    gemini: null,
    premium: {},
    stars: null,
    loading: true
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [notifications, setNotifications] = useState([])

  const fetchAllData = useCallback(async () => {
    try {
      setRefreshing(true)
      setError(null)

      const [statsData, usersData, ordersData, pendingData, couponsData, referrersData, settingsData, activityData, geminiPrice, premiumPrices, starsPrice] = 
        await Promise.all([
          api.getDashboardStats(),
          api.getUsers(100, 0),
          api.getOrders(50, 0),
          api.getPendingOrders(),
          api.getCoupons(),
          api.getTopReferrers(15),
          api.getSettings(),
          api.getActivityStats(7),
          api.getGeminiPrice(),
          api.getPremiumPrices(),
          api.getStarsPrice()
        ])

      setStats(statsData)
      setUsers(usersData)
      setOrders(ordersData)
      setPendingOrders(pendingData)
      setCoupons(couponsData)
      setReferrers(referrersData)
      setSettings(settingsData)
      setActivity(activityData)
      setPrices({
        gemini: geminiPrice,
        premium: premiumPrices,
        stars: starsPrice,
        loading: false
      })
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const refresh = useCallback(() => {
    api.invalidateCache()
    return fetchAllData()
  }, [fetchAllData])

  // Sends the customer a real Telegram DM confirming what just happened
  const notifyOrderStatus = useCallback(async (order, status, updates = {}) => {
    if (!order?.user_id) return

    const label = (order.order_type || '').replace(/_/g, ' ').toUpperCase()
    const amount = order.price_display || `${order.price} ETB`
    let message = null

    if (status === 'approved') {
      message =
        `✅ <b>Your order has been approved!</b>\n\n` +
        `Order: #${order.id} — ${label}\n` +
        `Amount: ${amount}\n\n` +
        `We're processing it now — you'll get another message once it's complete. 🎉`
    } else if (status === 'rejected') {
      const reason = updates.rejection_reason
      message =
        `❌ <b>Your order was rejected</b>\n\n` +
        `Order: #${order.id} — ${label}\n` +
        `Amount: ${amount}\n` +
        (reason ? `Reason: ${reason}\n` : '') +
        `\nIf you believe this is a mistake, please contact support.`
    } else if (status === 'completed') {
      message =
        `🎉 <b>Your order is complete!</b>\n\n` +
        `Order: #${order.id} — ${label}\n` +
        `Amount: ${amount}\n\n` +
        `Thank you for using our service! 🙏`
    }

    if (!message) return

    try {
      await api.notifyUser(order.user_id, message)
    } catch (err) {
      console.error('Failed to notify user of order status:', err.message)
    }
  }, [])

  const findOrder = useCallback(
    (orderId) => orders.find(o => o.id === orderId) || pendingOrders.find(o => o.id === orderId),
    [orders, pendingOrders]
  )

  // Price management methods
  const updateGeminiPrice = useCallback(async (price) => {
    try {
      await api.updateGeminiPrice(price)
      setPrices(prev => ({ ...prev, gemini: price }))
      return true
    } catch (err) {
      setError(`Failed to update Gemini price: ${err.message}`)
      throw err
    }
  }, [])

  const updatePremiumPrice = useCallback(async (durationKey, price) => {
    try {
      await api.updatePremiumPrice(durationKey, price)
      setPrices(prev => ({
        ...prev,
        premium: { ...prev.premium, [durationKey]: { ...prev.premium[durationKey], priceInBirr: price } }
      }))
      return true
    } catch (err) {
      setError(`Failed to update Premium price: ${err.message}`)
      throw err
    }
  }, [])

  const updateStarsPrice = useCallback(async (price) => {
    try {
      await api.updateStarsPrice(price)
      setPrices(prev => ({ ...prev, stars: price }))
      return true
    } catch (err) {
      setError(`Failed to update Stars price: ${err.message}`)
      throw err
    }
  }, [])

  // Real-time subscriptions
  useEffect(() => {
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

    const orderUpdatesSub = api.subscribeToOrderUpdates((updatedOrder) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
      setPendingOrders(prev => prev.filter(o => o.id !== updatedOrder.id))
      if (updatedOrder.status === 'pending') {
        setPendingOrders(prev => [updatedOrder, ...prev])
      }
      api.getDashboardStats().then(setStats)
    })

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
    prices,
    loading,
    refreshing,
    error,
    notifications,
    refresh,
    api,
    updateSetting: async (key, value) => {
      try {
        await api.updateSetting(key, value)
        setSettings(prev => ({ ...prev, [key]: value }))
      } catch (err) {
        setError(`Failed to update setting: ${err.message}`)
        throw err
      }
    },
    updateOrderStatus: async (orderId, status, updates = {}) => {
      try {
        const order = findOrder(orderId)
        await api.updateOrderStatus(orderId, status, updates)
        await notifyOrderStatus(order, status, updates)
        await refresh()
      } catch (err) {
        setError(`Failed to update order status: ${err.message}`)
        throw err
      }
    },
    rejectOrder: async (orderId, reason) => {
      try {
        const order = findOrder(orderId)
        const updates = { rejection_reason: reason || null }
        await api.updateOrderStatus(orderId, 'rejected', updates)
        await notifyOrderStatus(order, 'rejected', updates)
        await refresh()
      } catch (err) {
        setError(`Failed to reject order: ${err.message}`)
        throw err
      }
    },
    createCoupon: async (couponData) => {
      try {
        const newCoupon = await api.createCoupon(couponData)
        setCoupons(prev => [newCoupon, ...prev])
        return newCoupon
      } catch (err) {
        setError(`Failed to create coupon: ${err.message}`)
        throw err
      }
    },
    deleteCoupon: async (couponId) => {
      try {
        await api.deleteCoupon(couponId)
        setCoupons(prev => prev.filter(c => c.id !== couponId))
      } catch (err) {
        setError(`Failed to delete coupon: ${err.message}`)
        throw err
      }
    },
    // Price management methods
    updateGeminiPrice,
    updatePremiumPrice,
    updateStarsPrice,
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
