// src/services/api.js
import { supabase, SETTINGS_KEYS } from '../lib/supabase'

// Cache TTLs
const STATS_CACHE_TTL = 15000
const USERS_CACHE_TTL = 30000
const ORDERS_CACHE_TTL = 10000
const COUPONS_CACHE_TTL = 30000
const SETTINGS_CACHE_TTL = 30000

// In-memory cache
class Cache {
  constructor() { this.store = new Map() }
  
  get(key) {
    const item = this.store.get(key)
    if (item && Date.now() < item.expires) return item.value
    if (item) this.store.delete(key)
    return null
  }
  
  set(key, value, ttl) {
    this.store.set(key, { value, expires: Date.now() + ttl })
  }
  
  invalidate(key) {
    if (key) this.store.delete(key)
    else this.store.clear()
  }
}

const cache = new Cache()

export const api = {
  // ============================================
  // DASHBOARD STATS
  // ============================================

  async getDashboardStats() {
    const cacheKey = 'dashboard_stats'
    const cached = cache.get(cacheKey)
    if (cached) return cached

    try {
      const { data, error } = await supabase.rpc('admin_dashboard_stats')
      
      if (error) throw error
      
      const row = Array.isArray(data) ? data[0] : data
      const stats = {
        totalUsers: Number(row.total_users) || 0,
        totalBalance: Number(row.total_balance) || 0,
        totalReferrals: Number(row.total_referrals) || 0,
        totalReferredUsers: Number(row.total_referred_users) || 0,
        pendingOrders: Number(row.pending_orders) || 0,
        approvedOrders: Number(row.approved_orders) || 0,
        rejectedOrders: Number(row.rejected_orders) || 0,
        completedOrders: Number(row.completed_orders) || 0,
        totalOrders: Number(row.total_orders) || 0,
        geminiOrders: 0,
        premiumOrders: 0,
        starsOrders: 0,
        usdtOrders: 0,
      }

      // Get service breakdown
      try {
        const { data: serviceData } = await supabase
          .from('orders')
          .select('order_type')
        
        if (serviceData) {
          serviceData.forEach(o => {
            if (o.order_type === 'gemini_pro') stats.geminiOrders++
            else if (o.order_type === 'telegram_premium') stats.premiumOrders++
            else if (o.order_type === 'telegram_stars') stats.starsOrders++
            else if (o.order_type === 'usdt_sell') stats.usdtOrders++
          })
        }
      } catch (e) { /* ignore service breakdown errors */ }

      cache.set(cacheKey, stats, STATS_CACHE_TTL)
      return stats
    } catch (error) {
      console.warn('RPC fallback:', error.message)
      return this.getDashboardStatsFallback()
    }
  },

  async getDashboardStatsFallback() {
    const [users, orders] = await Promise.all([
      supabase.from('users').select('balance, referral_count, inviter_id'),
      supabase.from('orders').select('status, order_type'),
    ])

    const userData = users.data || []
    const orderData = orders.data || []

    const stats = {
      totalUsers: userData.length,
      totalBalance: userData.reduce((s, u) => s + (u.balance || 0), 0),
      totalReferrals: userData.reduce((s, u) => s + (u.referral_count || 0), 0),
      totalReferredUsers: userData.filter(u => u.inviter_id).length,
      pendingOrders: orderData.filter(o => o.status === 'pending').length,
      approvedOrders: orderData.filter(o => o.status === 'approved').length,
      rejectedOrders: orderData.filter(o => o.status === 'rejected').length,
      completedOrders: orderData.filter(o => o.status === 'completed').length,
      totalOrders: orderData.length,
      geminiOrders: orderData.filter(o => o.order_type === 'gemini_pro').length,
      premiumOrders: orderData.filter(o => o.order_type === 'telegram_premium').length,
      starsOrders: orderData.filter(o => o.order_type === 'telegram_stars').length,
      usdtOrders: orderData.filter(o => o.order_type === 'usdt_sell').length,
    }

    cache.set('dashboard_stats', stats, STATS_CACHE_TTL)
    return stats
  },

  // ============================================
  // USERS
  // ============================================

  async getUsers(limit = 50, offset = 0) {
    const cacheKey = `users_${limit}_${offset}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('joined_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Get order counts for each user
    const usersWithOrders = await Promise.all((data || []).map(async (u) => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', u.user_id)
      
      return { ...u, order_count: count || 0 }
    }))

    cache.set(cacheKey, usersWithOrders, USERS_CACHE_TTL)
    return usersWithOrders
  },

  async getUserById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', String(userId))
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async searchUsers(query) {
    if (!query || query.length < 2) return []

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`name.ilike.%${query}%,username.ilike.%${query}%,user_id.ilike.%${query}%`)
      .limit(20)

    if (error) throw error
    return data || []
  },

  async updateUser(userId, updates) {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', String(userId))

    if (error) throw error
    cache.invalidate('users_')
    return true
  },

  // ============================================
  // ORDERS
  // ============================================

  async getOrders(limit = 50, offset = 0, status = null) {
    let query = supabase
      .from('orders')
      .select('*, users(name, username)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getOrderById(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, users(name, username)')
      .eq('id', orderId)
      .single()

    if (error) throw error
    return data
  },

  async updateOrderStatus(orderId, status, updates = {}) {
    const payload = {
      status,
      updated_at: new Date().toISOString(),
      ...updates
    }

    const { error } = await supabase
      .from('orders')
      .update(payload)
      .eq('id', orderId)

    if (error) throw error
    
    cache.invalidate('dashboard_stats')
    cache.invalidate('orders_')
    return true
  },

  async updateOrderScreenshot(orderId, fileId) {
    const { error } = await supabase
      .from('orders')
      .update({ screenshot_file_id: fileId })
      .eq('id', orderId)

    if (error) throw error
    return true
  },

  async getPendingOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, users(name, username)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getOrdersByUser(userId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', String(userId))
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // ============================================
  // COUPONS
  // ============================================

  async getCoupons() {
    const cacheKey = 'coupons'
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    cache.set(cacheKey, data || [], COUPONS_CACHE_TTL)
    return data || []
  },

  async createCoupon(couponData) {
    const { data, error } = await supabase
      .from('coupons')
      .insert([{
        code: couponData.code,
        discount_percent: couponData.discount_percent,
        max_uses: couponData.max_uses || 0,
        used_count: 0,
        expiry_date: couponData.expiry_date || null,
        created_by: couponData.created_by || null,
        is_referral: couponData.is_referral || false,
        referral_claimed_by: couponData.referral_claimed_by || null,
      }])
      .select()
      .single()

    if (error) throw error
    cache.invalidate('coupons')
    return data
  },

  async updateCoupon(couponId, updates) {
    const { data, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', couponId)
      .select()
      .single()

    if (error) throw error
    cache.invalidate('coupons')
    return data
  },

  async deleteCoupon(couponId) {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId)

    if (error) throw error
    cache.invalidate('coupons')
    return true
  },

  async getCouponByCode(code) {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // ============================================
  // SETTINGS
  // ============================================

  async getSettings() {
    const cacheKey = 'settings'
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('bot_settings')
      .select('*')

    if (error) throw error
    
    const settings = {}
    ;(data || []).forEach(row => {
      settings[row.key] = row.value
    })
    
    cache.set(cacheKey, settings, SETTINGS_CACHE_TTL)
    return settings
  },

  async getSetting(key, defaultValue) {
    const { data, error } = await supabase
      .from('bot_settings')
      .select('value')
      .eq('key', key)
      .limit(1)

    if (error) throw error
    return data && data.length > 0 ? data[0].value : defaultValue
  },

  async updateSetting(key, value) {
    // Check if exists
    const { data: existing } = await supabase
      .from('bot_settings')
      .select('key')
      .eq('key', key)
      .limit(1)

    let error
    if (existing && existing.length > 0) {
      const result = await supabase
        .from('bot_settings')
        .update({ value: String(value) })
        .eq('key', key)
      error = result.error
    } else {
      const result = await supabase
        .from('bot_settings')
        .insert([{ key, value: String(value) }])
      error = result.error
    }

    if (error) throw error
    cache.invalidate('settings')
    return true
  },

  async updateSettings(settings) {
    const results = await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        this.updateSetting(key, value)
      )
    )
    return results.every(r => r === true)
  },

  // ============================================
  // REFERRALS
  // ============================================

  async getTopReferrers(limit = 15) {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, name, username, referral_count, last_referral_milestone')
      .order('referral_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  async getUserReferrals(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, name, username, joined_date, referral_credited')
      .eq('inviter_id', String(userId))
      .order('joined_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  async updateReferralCount(userId, count) {
    const { error } = await supabase
      .from('users')
      .update({ referral_count: count })
      .eq('user_id', String(userId))

    if (error) throw error
    cache.invalidate('dashboard_stats')
    return true
  },

  // ============================================
  // BROADCAST
  // ============================================

  async getAllUserIds() {
    const { data, error } = await supabase
      .from('users')
      .select('user_id')

    if (error) throw error
    return data || []
  },

  async sendBroadcastMessage(text, photoFileId = null, keyboard = null) {
    const users = await this.getAllUserIds()
    let sent = 0
    let failed = 0

    for (const user of users) {
      try {
        if (photoFileId) {
          await supabase.functions.invoke('send-photo', {
            body: { userId: user.user_id, photoFileId, caption: text, keyboard }
          })
        } else {
          await supabase.functions.invoke('send-message', {
            body: { userId: user.user_id, text, keyboard }
          })
        }
        sent++
      } catch {
        failed++
      }
    }

    return { sent, failed, total: users.length }
  },

  // ============================================
  // ACTIVITY / ANALYTICS
  // ============================================

  async getActivityStats(days = 7) {
    const { data, error } = await supabase
      .from('message_activity')
      .select('*')
      .order('date', { ascending: true })
      .limit(days)

    if (error) {
      return this.generateMockActivity(days)
    }
    return data || []
  },

  generateMockActivity(days) {
    const result = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      result.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        messages: Math.floor(Math.random() * 3000) + 1000,
        orders: Math.floor(Math.random() * 40) + 10
      })
    }
    return result
  },

  // ============================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================

  subscribeToOrders(callback) {
    return supabase
      .channel('orders_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          const order = await this.getOrderById(payload.new.id)
          callback(order)
        }
      )
      .subscribe()
  },

  subscribeToOrderUpdates(callback) {
    return supabase
      .channel('order_updates_channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()
  },

  subscribeToNewUsers(callback) {
    return supabase
      .channel('users_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()
  },

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  invalidateCache() {
    cache.invalidate()
  }
}