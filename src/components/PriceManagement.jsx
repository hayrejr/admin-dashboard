// src/components/PriceManagement.jsx
import React, { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { 
  DollarSign, 
  Edit2, 
  Check, 
  X, 
  RefreshCw,
  Sparkles,
  Send,
  Star,
  AlertCircle
} from 'lucide-react'

const PREMIUM_LABELS = {
  "1m": "1 Month",
  "3m": "3 Months", 
  "6m": "6 Months",
  "1y": "1 Year",
  "1y2": "1 Year (Login Required)"
}

export function PriceManagement() {
  const { prices, refresh, updateGeminiPrice, updatePremiumPrice, updateStarsPrice } = useAdmin()
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const startEdit = (key, currentValue) => {
    setEditing(key)
    setEditValue(String(currentValue))
    setError(null)
    setSuccess(null)
  }

  const cancelEdit = () => {
    setEditing(null)
    setEditValue('')
    setError(null)
  }

  const handleSave = async (key, updater) => {
    const value = parseFloat(editValue)
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid positive number')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await updater(value)
      setSuccess('Price updated successfully!')
      setEditing(null)
      setEditValue('')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update price')
    } finally {
      setSaving(false)
    }
  }

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '—'
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  if (prices.loading) {
    return (
      <div className="price-loading">
        <div className="loading-spinner" />
        <p>Loading prices...</p>
      </div>
    )
  }

  return (
    <div className="price-management">
      <div className="price-header">
        <h2>💰 Product Prices</h2>
        <button onClick={refresh} className="btn btn-outline">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="price-alert price-alert--error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="price-alert price-alert--success">
          <Check size={18} />
          {success}
        </div>
      )}

      {/* Gemini AI Pro */}
      <div className="price-card">
        <div className="price-card__header">
          <div className="price-card__icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h3>Google AI Pro (18m)</h3>
            <p className="price-card__sub">Gemini Pro subscription</p>
          </div>
        </div>
        <div className="price-card__body">
          {editing === 'gemini' ? (
            <div className="price-edit">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                min="1"
                step="1"
                autoFocus
                className="price-input"
              />
              <span className="price-currency">ብር</span>
              <button 
                className="btn btn-primary" 
                onClick={() => handleSave('gemini', updateGeminiPrice)}
                disabled={saving}
              >
                <Check size={16} />
                Save
              </button>
              <button 
                className="btn btn-outline" 
                onClick={cancelEdit}
                disabled={saving}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          ) : (
            <div className="price-display">
              <span className="price-value">{formatPrice(prices.gemini)} ብር</span>
              <button className="btn btn-outline" onClick={() => startEdit('gemini', prices.gemini)}>
                <Edit2 size={14} />
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Telegram Premium */}
      <div className="price-card">
        <div className="price-card__header">
          <div className="price-card__icon">
            <Send size={20} />
          </div>
          <div>
            <h3>Telegram Premium</h3>
            <p className="price-card__sub">All duration packages</p>
          </div>
        </div>
        <div className="price-card__body price-card__body--grid">
          {Object.entries(PREMIUM_LABELS).map(([key, label]) => {
            const currentPrice = prices.premium?.[key]?.priceInBirr || 0
            const editKey = `premium_${key}`

            return (
              <div key={key} className="price-item">
                <div className="price-item__label">{label}</div>
                {editing === editKey ? (
                  <div className="price-edit price-edit--inline">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      min="1"
                      step="1"
                      autoFocus
                      className="price-input price-input--small"
                    />
                    <span className="price-currency">ብር</span>
                    <button 
                      className="btn btn-primary btn-small" 
                      onClick={() => handleSave(editKey, (val) => updatePremiumPrice(key, val))}
                      disabled={saving}
                    >
                      <Check size={14} />
                    </button>
                    <button 
                      className="btn btn-outline btn-small" 
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="price-display price-display--inline">
                    <span className="price-value">{formatPrice(currentPrice)} ብር</span>
                    <button className="btn btn-outline btn-small" onClick={() => startEdit(editKey, currentPrice)}>
                      <Edit2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Telegram Stars */}
      <div className="price-card">
        <div className="price-card__header">
          <div className="price-card__icon">
            <Star size={20} />
          </div>
          <div>
            <h3>Telegram Stars</h3>
            <p className="price-card__sub">Price per star</p>
          </div>
        </div>
        <div className="price-card__body">
          {editing === 'stars' ? (
            <div className="price-edit">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                min="0.01"
                step="0.01"
                autoFocus
                className="price-input"
              />
              <span className="price-currency">ብር / star</span>
              <button 
                className="btn btn-primary" 
                onClick={() => handleSave('stars', updateStarsPrice)}
                disabled={saving}
              >
                <Check size={16} />
                Save
              </button>
              <button 
                className="btn btn-outline" 
                onClick={cancelEdit}
                disabled={saving}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          ) : (
            <div className="price-display">
              <span className="price-value">{formatPrice(prices.stars)} ብር / star</span>
              <button className="btn btn-outline" onClick={() => startEdit('stars', prices.stars)}>
                <Edit2 size={14} />
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .price-management {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .price-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .price-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .price-alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          border: 1px solid;
        }

        .price-alert--error {
          background: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .price-alert--success {
          background: #ecfdf5;
          border-color: #a7f3d0;
          color: #059669;
        }

        .price-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .price-card__header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .price-card__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
          background: #eff6ff;
          color: #2563eb;
        }

        .price-card__header h3 {
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #0f172a;
        }

        .price-card__sub {
          margin: 0;
          font-size: 0.8125rem;
          color: #94a3b8;
        }

        .price-card__body {
          padding: 1.25rem;
        }

        .price-card__body--grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }

        .price-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          background: #f8fafc;
          border-radius: 0.5rem;
        }

        .price-item__label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569;
        }

        .price-display {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .price-display--inline {
          gap: 0.5rem;
        }

        .price-value {
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
        }

        .price-edit {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .price-edit--inline {
          gap: 0.375rem;
        }

        .price-input {
          width: 120px;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .price-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }

        .price-input--small {
          width: 80px;
          padding: 0.375rem 0.5rem;
          font-size: 0.8125rem;
        }

        .price-currency {
          font-size: 0.875rem;
          font-weight: 500;
          color: #94a3b8;
        }

        .btn-small {
          padding: 0.375rem 0.5rem;
          font-size: 0.75rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          border-radius: 0.375rem;
          padding: 0.5rem 0.875rem;
          font-size: 0.8125rem;
          font-weight: 600;
          font-family: inherit;
          border: 1px solid;
          cursor: pointer;
          transition: all 0.15s ease;
          background: #ffffff;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #2563eb;
          border-color: #2563eb;
          color: #ffffff;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
          border-color: #1d4ed8;
        }

        .btn-outline {
          border-color: #e2e8f0;
          color: #475569;
        }

        .btn-outline:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .price-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          gap: 1rem;
          color: #94a3b8;
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (min-width: 640px) {
          .price-card__body--grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (min-width: 1024px) {
          .price-card__body--grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  )
}