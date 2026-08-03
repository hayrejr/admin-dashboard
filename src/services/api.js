// src/services/api.js
import { supabase } from '../lib/supabase'

// Cache TTLs
const STATS_CACHE_TTL = 15000
const USERS_CACHE_TTL = 30000
const ORDERS_CACHE_TTL = 10000
const COUPONS_CACHE_TTL = 30000
const SETTINGS_CACHE_TTL = 30000
const PRICES_CACHE_TTL = 30000

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

  // Deletes every cached entry whose key starts with `prefix`.
  // Needed for keys like `users_${limit}_${offset}` where the caller
  // only knows the prefix ('users_') and not the exact cached key.
  invalidatePrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key)
    }
  }
}

const cache = new Cache()

// Sleep utility for rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Default prices — mirrors handlers/priceConfig.js DEFAULT_PRICES on the bot
// side, so the dashboard never shows blank/undefined values before the
// first real fetch resolves.
const DEFAULT_PRICES = {
  gemini: { priceInBirr: 350 },
  coursera: { priceInBirr: 165, inStock: true },
  premium: {
    "1m": { priceInBirr: 800 },
    "3m": { priceInBirr: 2390 },
    "6m": { priceInBirr: 3190 },
    "1y": { priceInBirr: 5690 },
    "1y2": { priceInBirr: 5100 }
  },
  stars: { pricePerStar: 3.25 },
  airtime: {
    data: {
      "1wd": { priceInBirr: 550 },
      "1wdb": { priceInBirr: 600 },
      "1md": { priceInBirr: 1750 },
      "1mdb": { priceInBirr: 1850 },
      "1mdv": { priceInBirr: 2400 },
    },
    voice: {
      "1mv": { priceInBirr: 1000 },
      "1mvd": { priceInBirr: 2400 },
    },
  },
}

// Basic HTML-escaping for values interpolated into Telegram HTML-parse-mode
// messages (credential delivery). Keeps a stray "<" or "&" in a password
// from breaking the message or being interpreted as markup.
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function getProductPrices() {
  const { data, error } = await supabase
    .from('bot_settings')
    .select('value')
    .eq('key', 'product_prices')
    .limit(1)

  if (error) throw error
  
  if (data && data.length > 0) {
    try {
      const parsed = JSON.parse(data[0].value)
      // Deep-merge with defaults so a stored blob missing a newer key
      // (e.g. coursera, airtime) falls back to its default instead of
      // coming back undefined — a shallow spread would drop those.
      return deepMergePrices(DEFAULT_PRICES, parsed)
    } catch (e) { /* use default */ }
  }
  
  return { ...DEFAULT_PRICES }
}

function deepMergePrices(base, override) {
  const result = JSON.parse(JSON.stringify(base))
  for (const key of Object.keys(override || {})) {
    if (
      override[key] && typeof override[key] === 'object' && !Array.isArray(override[key]) &&
      result[key] && typeof result[key] === 'object'
    ) {
      result[key] = deepMergePrices(result[key], override[key])
    } else {
      result[key] = override[key]
    }
  }
  return result
}

async function saveProductPrices(prices) {
  const { error } = await supabase
    .from('bot_settings')
    .upsert(
      { key: 'product_prices', value: JSON.stringify(prices) },
      { onConflict: 'key' }
    )
  
  if (error) throw error
  
  // Invalidate all price caches
  cache.invalidate('price_gemini')
  cache.invalidate('price_coursera')
  cache.invalidate('price_coursera_stock')
  cache.invalidate('price_premium')
  cache.invalidate('price_stars')
  cache.invalidate('price_airtime_data')
  cache.invalidate('price_airtime_voice')
}

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
  // PRICE MANAGEMENT
  // ============================================

  async getGeminiPrice() {
    const cacheKey = 'price_gemini'
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const prices = await getProductPrices()
    const result = prices.gemini?.priceInBirr || DEFAULT_PRICES.gemini.priceInBirr
    cache.set(cacheKey, result, PRICES_CACHE_TTL)
    return result
  },

  async getPremiumPrices() {
    const cacheKey = 'price_premium'
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const prices = await getProductPrices()
    const result = prices.premium || DEFAULT_PRICES.premium
    cache.set(cacheKey, result, PRICES_CACHE_TTL)
    return result
  },

  async getStarsPrice() {
    const cacheKey = 'price_stars'
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const prices = await getProductPrices()
    const result = prices.stars?.pricePerStar || DEFAULT_PRICES.stars.pricePerStar
    cache.set(cacheKey, result, PRICES_CACHE_TTL)
    return result
  },

  async getCourseraPrice() {
    const cacheKey = 'price_coursera'
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const prices = await getProductPrices()
    const result = prices.coursera?.priceInBirr ?? DEFAULT_PRICES.coursera.priceInBirr
    cache.set(cacheKey, result, PRICES_CACHE_TTL)
    return result
  },

  async getCourseraStock() {
    const cacheKey = 'price_coursera_stock'
    const cached = cache.get(cacheKey)
    if (cached !== null) return cached

    const prices = await getProductPrices()
    const result = prices.coursera?.inStock !== false
    cache.set(cacheKey, result, PRICES_CACHE_TTL)
    return result
  },

  async getAirtimeDataPrices() {
    const cacheKey = 'price_airtime_data'
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const prices = await getProductPrices()
    const result = prices.airtime?.data || DEFAULT_PRICES.airtime.data
    cache.set(cacheKey, result, PRICES_CACHE_TTL)
    return result
  },

  async getAirtimeVoicePrices() {
    const cacheKey = 'price_airtime_voice'
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const prices = await getProductPrices()
    const result = prices.airtime?.voice || DEFAULT_PRICES.airtime.voice
    cache.set(cacheKey, result, PRICES_CACHE_TTL)
    return result
  },

  async getAllPrices() {
    const prices = await getProductPrices()
    return {
      gemini: prices.gemini?.priceInBirr || DEFAULT_PRICES.gemini.priceInBirr,
      coursera: prices.coursera?.priceInBirr ?? DEFAULT_PRICES.coursera.priceInBirr,
      courseraInStock: prices.coursera?.inStock !== false,
      premium: prices.premium || DEFAULT_PRICES.premium,
      stars: prices.stars?.pricePerStar || DEFAULT_PRICES.stars.pricePerStar,
      airtime: prices.airtime || DEFAULT_PRICES.airtime,
    }
  },

  async updateGeminiPrice(priceInBirr) {
    const prices = await getProductPrices()
    if (!prices.gemini) prices.gemini = {}
    prices.gemini.priceInBirr = priceInBirr
    await saveProductPrices(prices)
    return true
  },

  async updateCourseraPrice(priceInBirr) {
    const prices = await getProductPrices()
    if (!prices.coursera) prices.coursera = {}
    prices.coursera.priceInBirr = priceInBirr
    await saveProductPrices(prices)
    return true
  },

  async updateCourseraStock(inStock) {
    const prices = await getProductPrices()
    if (!prices.coursera) prices.coursera = {}
    prices.coursera.inStock = !!inStock
    await saveProductPrices(prices)
    return true
  },

  async updatePremiumPrice(durationKey, priceInBirr) {
    const prices = await getProductPrices()
    if (!prices.premium) prices.premium = {}
    if (!prices.premium[durationKey]) prices.premium[durationKey] = {}
    prices.premium[durationKey].priceInBirr = priceInBirr
    await saveProductPrices(prices)
    return true
  },

  async updateStarsPrice(pricePerStar) {
    const prices = await getProductPrices()
    if (!prices.stars) prices.stars = {}
    prices.stars.pricePerStar = pricePerStar
    await saveProductPrices(prices)
    return true
  },

  async updateAirtimePrice(category, durationKey, priceInBirr) {
    const prices = await getProductPrices()
    if (!prices.airtime) prices.airtime = {}
    if (!prices.airtime[category]) prices.airtime[category] = {}
    if (!prices.airtime[category][durationKey]) prices.airtime[category][durationKey] = {}
    prices.airtime[category][durationKey].priceInBirr = priceInBirr
    await saveProductPrices(prices)
    return true
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
    cache.invalidatePrefix('users_')
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
    cache.invalidatePrefix('orders_')
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
        code: couponData.code.toUpperCase(),
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

  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, name, username')

    if (error) throw error
    return data || []
  },

  async notifyUser(userId, message, parseMode = 'HTML') {
    try {
      const { error } = await supabase.functions.invoke('send-telegram-message', {
        body: {
          userId: String(userId),
          text: message,
          parseMode
        }
      })
      
      if (error) throw error
      return true
    } catch (err) {
      console.error('Failed to notify user:', err)
      throw err
    }
  },

  // Delivers Coursera account credentials by Telegram DM, in the same
  // format the bot itself sends when an admin approves via chat
  // (handlers/coursera.js). Used by the dashboard's Orders panel when the
  // admin approves a pending Coursera order and enters the account email
  // and password right there instead of in Telegram.
  async sendCourseraCredentials(order, email, password) {
    const label = order?.package_label || 'Coursera Plus'
    const message =
      `<b>✔️ Your order has been approved!</b>\n\n` +
      `Your ${label} has been verified and your account details are below. 🚀\n\n` +
      `<b>📧 Coursera Account</b>\n\n` +
      `<b>Email:</b> <code>${escapeHtml(email)}</code>\n` +
      `<b>Password:</b> <code>${escapeHtml(password)}</code>\n\n` +
      `<b>ℹ️ Instructions</b>\n` +
      `Log in to Coursera using the email and password above. Change your password after your first login, ` +
      `add a recovery email, and connect your Google or Facebook account (recommended).\n\n` +
      `<b>⚠️ Important:</b> The email on the account cannot be changed until the subscription expires. ` +
      `Certificates are issued in your own name.\n\n` +
      `Thank you for your purchase! 🙏`

    return this.notifyUser(order.user_id, message, 'HTML')
  },

  async sendBroadcastMessage(text, photoFileId = null, keyboard = null, onProgress = null, options = {}) {
    const { parseMode = 'HTML', speed = 8 } = options
    
    if (!text && !photoFileId) {
      throw new Error('Message or photo must be provided')
    }

    try {
      const users = await this.getAllUsers()
      
      if (users.length === 0) {
        return { sent: 0, failed: 0, total: 0, error: 'No users to broadcast to' }
      }

      let sent = 0
      let failed = 0
      let firstErrorMessage = null
      const totalUsers = users.length
      const delayMs = Math.max(125, Math.round(1000 / speed))

      for (let i = 0; i < users.length; i++) {
        const user = users[i]
        
        try {
          if (photoFileId) {
            let personalizedText = text
              .replace(/{user_name}/g, user.name || 'User')
              .replace(/{username}/g, user.username ? `@${user.username}` : '@unknown')
              .replace(/{user_id}/g, user.user_id)

            const { error: fnError } = await supabase.functions.invoke('send-telegram-photo', {
              body: {
                userId: String(user.user_id),
                photoFileId,
                caption: personalizedText,
                parseMode,
                keyboard
              }
            })
            if (fnError) throw fnError
          } else {
            let personalizedText = text
              .replace(/{user_name}/g, user.name || 'User')
              .replace(/{username}/g, user.username ? `@${user.username}` : '@unknown')
              .replace(/{user_id}/g, user.user_id)

            const { error: fnError } = await supabase.functions.invoke('send-telegram-message', {
              body: {
                userId: String(user.user_id),
                text: personalizedText,
                parseMode,
                keyboard
              }
            })
            if (fnError) throw fnError
          }
          
          sent++
        } catch (error) {
          console.error(`Failed to send to user ${user.user_id}:`, error)
          failed++
          if (!firstErrorMessage) {
            firstErrorMessage = error?.context
              ? `${error.message} (status ${error.context.status})`
              : (error?.message || String(error))
          }
        }

        const progress = Math.round(((i + 1) / totalUsers) * 100)
        if (onProgress) {
          onProgress(progress, { sent, failed, total: totalUsers })
        }

        if (i < users.length - 1) {
          await sleep(delayMs)
        }
      }

      return {
        sent,
        failed,
        total: totalUsers,
        ...(failed > 0 && sent === 0 && firstErrorMessage
          ? { error: `All sends failed. First error: ${firstErrorMessage}` }
          : {})
      }
    } catch (error) {
      console.error('Broadcast error:', error)
      throw error
    }
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
