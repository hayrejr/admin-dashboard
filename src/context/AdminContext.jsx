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
  const [withdrawals, setWithdrawals] = useState([])
  const [usersOverview, setUsersOverview] = useState(null)
  const [prices, setPrices] = useState({
    gemini: null,
    coursera: null,
    courseraInStock: true,
    premium: {},
    stars: null,
    airtime: { data: {}, voice: {} },
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

      const [
        statsData, usersData, ordersData, pendingData, couponsData, referrersData,
        settingsData, activityData, geminiPrice, premiumPrices, starsPrice,
        courseraPrice, courseraInStock, airtimeData, airtimeVoice,
        withdrawalsData, usersOverviewData,
      ] = 
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
          api.getStarsPrice(),
          api.getCourseraPrice(),
          api.getCourseraStock(),
          api.getAirtimeDataPrices(),
          api.getAirtimeVoicePrices(),
          api.getWithdrawals(100, 0),
          api.getUsersOverview(),
        ])

      setStats(statsData)
      setUsers(usersData)
      setOrders(ordersData)
      setPendingOrders(pendingData)
      setCoupons(couponsData)
      setReferrers(referrersData)
      setSettings(settingsData)
      setActivity(activityData)
      setWithdrawals(withdrawalsData)
      setUsersOverview(usersOverviewData)
      setPrices({
        gemini: geminiPrice,
        coursera: courseraPrice,
        courseraInStock,
        premium: premiumPrices,
        stars: starsPrice,
        airtime: { data: airtimeData, voice: airtimeVoice },
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

  // Stable identity (useCallback) so components that useEffect off it
  // — like the Users panel's order-history modal — don't refetch on
  // every AdminProvider re-render (30s auto-refresh, realtime pushes).
  const getUserOrders = useCallback((userId) => api.getOrdersByUser(userId), [])

  const findOrder = useCallback(
    (orderId) => orders.find(o => o.id === orderId) || pendingOrders.find(o => o.id === orderId),
    [orders, pendingOrders]
  )

  const findWithdrawal = useCallback(
    (withdrawalId) => withdrawals.find(w => w.id === withdrawalId),
    [withdrawals]
  )

  // Sends the customer a real Telegram DM confirming what happened to
  // their withdrawal — mirrors notifyOrderStatus above and the bot's own
  // notifyUserOfDecision()/notifyUserOfCompletion() (handlers/
  // adminWithdrawals.js).
  const notifyWithdrawalStatus = useCallback(async (withdrawal, status, updates = {}, newBalance = null) => {
    if (!withdrawal?.user_id) return

    const amount = `${Number(withdrawal.amount).toLocaleString()} ETB`
    let message = null

    if (status === 'completed') {
      message =
        `💸 <b>Withdrawal Paid</b> ✅\n\n` +
        `Withdrawal: #${withdrawal.id}\n` +
        `Amount: ${amount}\n` +
        `Method: ${withdrawal.method_display || withdrawal.method || 'N/A'}\n\n` +
        `Thank you for using our service! 🙏`
    } else if (status === 'rejected') {
      const reason = updates.rejection_reason
      message =
        `❌ <b>Withdrawal Rejected</b>\n\n` +
        `Withdrawal: #${withdrawal.id}\n` +
        `Amount: ${amount}\n` +
        (reason ? `Reason: ${reason}\n` : '') +
        (newBalance !== null ? `\n💰 The amount has been refunded — your new balance is ${Number(newBalance).toLocaleString()} ETB.` : '')
    }

    if (!message) return

    try {
      await api.notifyUser(withdrawal.user_id, message)
    } catch (err) {
      console.error('Failed to notify user of withdrawal status:', err.message)
    }
  }, [])

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

  const updateCourseraPrice = useCallback(async (price) => {
    try {
      await api.updateCourseraPrice(price)
      setPrices(prev => ({ ...prev, coursera: price }))
      return true
    } catch (err) {
      setError(`Failed to update Coursera price: ${err.message}`)
      throw err
    }
  }, [])

  const updateCourseraStock = useCallback(async (inStock) => {
    try {
      await api.updateCourseraStock(inStock)
      setPrices(prev => ({ ...prev, courseraInStock: inStock }))
      return true
    } catch (err) {
      setError(`Failed to update Coursera stock: ${err.message}`)
      throw err
    }
  }, [])

  const updateAirtimePrice = useCallback(async (category, durationKey, price) => {
    try {
      await api.updateAirtimePrice(category, durationKey, price)
      setPrices(prev => ({
        ...prev,
        airtime: {
          ...prev.airtime,
          [category]: {
            ...prev.airtime[category],
            [durationKey]: { ...prev.airtime[category]?.[durationKey], priceInBirr: price }
          }
        }
      }))
      return true
    } catch (err) {
      setError(`Failed to update Airtime price: ${err.message}`)
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

    // Keeps the Users table and Top Referrers panel live when the *bot*
    // changes a user row — e.g. crediting a referral, paying out a
    // withdrawal, or updating balance from a purchase — without waiting
    // for the 30s auto-refresh. Also picks up bans/unbans made from a
    // second admin tab.
    const userUpdatesSub = api.subscribeToUserUpdates((updatedUser) => {
      setUsers(prev => prev.map(u => (
        u.user_id === updatedUser.user_id ? { ...u, ...updatedUser } : u
      )))
      setReferrers(prev => {
        const idx = prev.findIndex(r => r.user_id === updatedUser.user_id)
        if (idx === -1) return prev
        const next = [...prev]
        next[idx] = { ...next[idx], ...updatedUser }
        return next.sort((a, b) => (b.referral_count || 0) - (a.referral_count || 0))
      })
      api.getDashboardStats().then(setStats)
    })

    // Keeps the Withdrawals panel live when a request comes in or its
    // status changes (e.g. approved/rejected from a second admin tab).
    const withdrawalsSub = api.subscribeToWithdrawals((newWithdrawal) => {
      setWithdrawals(prev => [newWithdrawal, ...prev])
      setNotifications(prev => [{
        id: Date.now(),
        type: 'withdrawal',
        title: '💸 New Withdrawal',
        message: `Withdrawal #${newWithdrawal.id} for ${newWithdrawal.amount} ETB`,
        data: newWithdrawal,
        read: false,
        timestamp: new Date().toISOString()
      }, ...prev])
    })

    const withdrawalUpdatesSub = api.subscribeToWithdrawalUpdates((updatedWithdrawal) => {
      setWithdrawals(prev => prev.map(w => w.id === updatedWithdrawal.id ? { ...w, ...updatedWithdrawal } : w))
    })

    // Keeps Price Management and referral settings (milestone step,
    // discount %, reward note) live when the *bot's* Telegram admin
    // wizard changes them, so the dashboard never shows a stale value.
    const settingsSub = api.subscribeToSettings((payload) => {
      const key = payload.new?.key || payload.old?.key
      if (key === 'product_prices') {
        api.getAllPrices().then((p) => setPrices({ ...p, loading: false }))
      } else {
        api.getSettings().then(setSettings)
      }
    })

    return () => {
      ordersSub.unsubscribe()
      orderUpdatesSub.unsubscribe()
      usersSub.unsubscribe()
      userUpdatesSub.unsubscribe()
      withdrawalsSub.unsubscribe()
      withdrawalUpdatesSub.unsubscribe()
      settingsSub.unsubscribe()
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
    withdrawals,
    usersOverview,
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
    // Coursera delivery is manual: approving sets the order to 'approved'
    // and DMs the account email/password straight from the dashboard,
    // instead of the admin having to switch to Telegram chat to type them
    // (see handlers/coursera.js's pendingCourseraCredentials flow).
    approveCourseraOrder: async (orderId, email, password) => {
      try {
        const order = findOrder(orderId)
        await api.updateOrderStatus(orderId, 'approved')
        await api.sendCourseraCredentials(order, email, password)
        await refresh()
      } catch (err) {
        setError(`Failed to approve Coursera order: ${err.message}`)
        throw err
      }
    },
    // Withdrawal management — marks the reserved payout as sent and DMs
    // the user, or rejects the request and refunds their balance.
    completeWithdrawal: async (withdrawalId) => {
      try {
        const withdrawal = findWithdrawal(withdrawalId)
        await api.completeWithdrawal(withdrawalId)
        await notifyWithdrawalStatus(withdrawal, 'completed')
        await refresh()
      } catch (err) {
        setError(`Failed to complete withdrawal: ${err.message}`)
        throw err
      }
    },
    rejectWithdrawal: async (withdrawalId, reason) => {
      try {
        const withdrawal = findWithdrawal(withdrawalId)
        const { newBalance } = await api.rejectWithdrawal(withdrawalId, reason || null)
        await notifyWithdrawalStatus(withdrawal, 'rejected', { rejection_reason: reason || null }, newBalance)
        await refresh()
      } catch (err) {
        setError(`Failed to reject withdrawal: ${err.message}`)
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
    updateCourseraPrice,
    updateCourseraStock,
    updatePremiumPrice,
    updateStarsPrice,
    updateAirtimePrice,
    // User management methods — each optimistically patches local
    // `users` state so the table reflects the change immediately,
    // rather than waiting on the realtime round-trip.
    adjustUserBalance: async (userId, newBalance) => {
      try {
        const updated = await api.adjustUserBalance(userId, newBalance)
        setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, ...updated } : u))
        return updated
      } catch (err) {
        setError(`Failed to update balance: ${err.message}`)
        throw err
      }
    },
    banUser: async (userId, reason) => {
      try {
        const updated = await api.banUser(userId, reason)
        setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, ...updated } : u))
        return updated
      } catch (err) {
        setError(`Failed to ban user: ${err.message}`)
        throw err
      }
    },
    unbanUser: async (userId) => {
      try {
        const updated = await api.unbanUser(userId)
        setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, ...updated } : u))
        return updated
      } catch (err) {
        setError(`Failed to unban user: ${err.message}`)
        throw err
      }
    },
    getUserOrders,
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
