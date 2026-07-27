import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

export function useDashboardData() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [referrers, setReferrers] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true)
      
      const [statsData, usersData, ordersData, referrersData, activityData] = await Promise.all([
        api.getDashboardStats(),
        api.getUsers(50, 0),
        api.getOrders(20, 0),
        api.getTopReferrers(10),
        api.getActivityStats(7)
      ])

      setStats(statsData)
      setUsers(usersData)
      setOrders(ordersData)
      setReferrers(referrersData)
      setActivity(activityData)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const refresh = useCallback(() => {
    api.invalidateCache()
    return fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    stats,
    users,
    orders,
    referrers,
    activity,
    loading,
    refreshing,
    error,
    refresh
  }
}