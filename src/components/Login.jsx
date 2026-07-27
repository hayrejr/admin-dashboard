import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Lock, Mail, Shield, Eye, EyeOff } from 'lucide-react'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <Shield className="login-logo-icon" />
              <span>NovaPlus</span>
            </div>
            <h1>Admin Login</h1>
            <p className="login-subtitle">
              Secure access to the NovaPlus administration dashboard
            </p>
          </div>

          {error && (
            <div className="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">
                <Mail className="input-icon" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@novaplus.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Lock className="input-icon" />
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p>Restricted access • Admin only</p>
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          padding: 1rem;
        }

        .login-container {
          width: 100%;
          max-width: 420px;
        }

        .login-card {
          background: #ffffff;
          border-radius: 1.5rem;
          padding: 2.5rem 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 1.5rem;
        }

        .login-logo-icon {
          width: 2rem;
          height: 2rem;
          color: #2563eb;
        }

        .login-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.5rem;
        }

        .login-subtitle {
          color: #64748b;
          font-size: 0.875rem;
          margin: 0;
        }

        .login-error {
          background: #fef2f2;
          color: #dc2626;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid #fecaca;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .form-group label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .input-icon {
          width: 0.875rem;
          height: 0.875rem;
        }

        .password-input-wrapper {
          position: relative;
        }

        .password-input-wrapper input {
          width: 100%;
          padding: 0.75rem 3rem 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          background: #f8fafc;
          box-sizing: border-box;
        }

        .password-input-wrapper input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
          background: #ffffff;
        }

        .password-input-wrapper input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-group input:not(.password-input-wrapper input) {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          background: #f8fafc;
          box-sizing: border-box;
        }

        .form-group input:not(.password-input-wrapper input):focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
          background: #ffffff;
        }

        .form-group input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          padding: 0.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .password-toggle:hover {
          color: #64748b;
        }

        .login-btn {
          padding: 0.875rem;
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          margin-top: 0.5rem;
        }

        .login-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .login-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-footer {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #f1f5f9;
        }

        .login-footer p {
          font-size: 0.75rem;
          color: #94a3b8;
          margin: 0;
        }

        .login-hint {
          margin-top: 0.25rem !important;
          font-size: 0.625rem !important;
          color: #cbd5e1 !important;
        }
      `}</style>
    </div>
  )
}