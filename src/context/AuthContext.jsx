import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

// Used only to label the account in the UI — the real check is the
// Supabase Auth session below, not this value.
const ADMIN_EMAIL_HINT = import.meta.env.VITE_ADMIN_EMAIL || 'admin@novaplus.com'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdminUser, setIsAdminUser] = useState(false)

  useEffect(() => {
    let mounted = true

    // Restore an existing session on load (Supabase persists this in
    // localStorage itself, safely, as an opaque token — not a password).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      setIsAdminUser(!!session?.user)
      setLoading(false)
    })

    // Keep state in sync with sign-in/out events (including token refresh).
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsAdminUser(!!session?.user)
      setLoading(false)
    })

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  // Real authentication: the email/password are sent to Supabase over
  // HTTPS and verified server-side. Nothing secret ships in the JS bundle.
  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setUser(data.user)
      setIsAdminUser(true)
      return data
    } catch (error) {
      throw new Error(error.message === 'Invalid login credentials' ? 'Invalid email or password' : error.message)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdminUser(false)
  }

  const value = {
    user,
    loading,
    isAdminUser,
    adminEmailHint: ADMIN_EMAIL_HINT,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
