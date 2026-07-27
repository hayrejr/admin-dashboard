import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, ADMIN_ID } from '../lib/supabase'

const AuthContext = createContext({})

// Admin credentials from .env
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@novaplus.com'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Admin123!'
const ADMIN_USER_ID = import.meta.env.VITE_ADMIN_USER_ID || '5522724001'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)

  // Check localStorage on load
  useEffect(() => {
    const storedUser = localStorage.getItem('admin_user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        setIsAdminUser(true)
      } catch (e) {
        localStorage.removeItem('admin_user')
      }
    }
    setLoading(false)
  }, [])

  // Simple login with .env credentials
  const signIn = async (email, password) => {
    setLoading(true)
    
    try {
      // Check against .env credentials
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const userData = {
          id: ADMIN_USER_ID,
          email: ADMIN_EMAIL,
          role: 'admin',
          user_metadata: { role: 'admin', name: 'Admin' }
        }
        
        // Store in localStorage
        localStorage.setItem('admin_user', JSON.stringify(userData))
        
        setUser(userData)
        setIsAdminUser(true)
        setLoading(false)
        return { data: { user: userData }, error: null }
      } else {
        throw new Error('Invalid credentials')
      }
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    localStorage.removeItem('admin_user')
    setUser(null)
    setIsAdminUser(false)
  }

  const value = {
    user,
    loading,
    isAdminUser,
    signIn,
    signOut
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