// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin settings keys
export const SETTINGS_KEYS = {
  NEW_USER_NOTIFY: 'new_user_notify',
  AUTO_REPLY: 'auto_reply',
  MAINTENANCE_MODE: 'maintenance_mode',
  ANALYTICS_ENABLED: 'analytics_enabled',
  REFERRAL_MILESTONE_STEP: 'referral_milestone_step',
  REFERRAL_REWARD_NOTE: 'referral_reward_note',
  REFERRAL_DISCOUNT_PERCENT: 'referral_discount_percent',
}

export const isAdmin = (userId) => {
  const adminId = import.meta.env.VITE_ADMIN_USER_ID || '5522724001'
  return String(userId) === String(adminId)
}