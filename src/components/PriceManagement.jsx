// src/components/PriceManagement.jsx
import React, { useState, useRef } from 'react'
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
  AlertCircle,
  GraduationCap,
  Smartphone,
  Package,
  Menu,
  ChevronDown,
  Zap,
  Award,
  Wifi,
  Mic,
} from 'lucide-react'

const PREMIUM_LABELS = {
  "1m": "1 Month",
  "3m": "3 Months", 
  "6m": "6 Months",
  "1y": "1 Year",
  "1y2": "1 Year (Login Required)"
}

const AIRTIME_DATA_LABELS = {
  "1wd": "1 Week Data",
  "1wdb": "1 Week Data (Bonus)",
  "1md": "1 Month Data",
  "1mdb": "1 Month Data (Bonus)",
  "1mdv": "1 Month Data + Voice",
}

const AIRTIME_VOICE_LABELS = {
  "1mv": "1 Month Voice",
  "1mvd": "1 Month Voice + Data",
}

// Category definitions
const CATEGORIES = [
  { 
    id: 'all', 
    label: 'All Products', 
    icon: Package,
    description: 'View all prices'
  },
  { 
    id: 'ai', 
    label: 'AI Services', 
    icon: Zap,
    description: 'Gemini Pro'
  },
  { 
    id: 'coursera', 
    label: 'Coursera', 
    icon: GraduationCap,
    description: 'Coursera Plus'
  },
  { 
    id: 'telegram', 
    label: 'Telegram', 
    icon: Send,
    description: 'Premium & Stars'
  },
  { 
    id: 'airtime_data', 
    label: 'Data Bundles', 
    icon: Wifi,
    description: 'Airtime Data'
  },
  { 
    id: 'airtime_voice', 
    label: 'Voice Bundles', 
    icon: Mic,
    description: 'Airtime Voice'
  },
]

export function PriceManagement() {
  const {
    prices, refresh,
    updateGeminiPrice, updatePremiumPrice, updateStarsPrice,
    updateCourseraPrice, updateCourseraStock, updateAirtimePrice,
  } = useAdmin()
  const [stockSaving, setStockSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

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

  const handleStockToggle = async () => {
    setStockSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await updateCourseraStock(!prices.courseraInStock)
      setSuccess('Coursera stock updated!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update stock status')
    } finally {
      setStockSaving(false)
    }
  }

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '—'
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  // Check if a category should be shown
  const shouldShowCategory = (categoryId) => {
    if (activeCategory === 'all') return true
    return categoryId === activeCategory
  }

  // Get current category label
  const getActiveCategoryLabel = () => {
    const cat = CATEGORIES.find(c => c.id === activeCategory)
    return cat ? cat.label : 'All Products'
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
        <div className="price-header__left">
          <h2>💰 Product Prices</h2>
          <span className="price-header__badge">{getActiveCategoryLabel()}</span>
        </div>
        <div className="price-header__right">
          <div className="category-menu" ref={menuRef}>
            <button 
              className="category-menu__trigger"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={16} />
              <span>{getActiveCategoryLabel()}</span>
              <ChevronDown size={14} className={`category-menu__arrow ${menuOpen ? 'category-menu__arrow--open' : ''}`} />
            </button>
            {menuOpen && (
              <div className="category-menu__dropdown">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon
                  const isActive = activeCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      className={`category-menu__item ${isActive ? 'category-menu__item--active' : ''}`}
                      onClick={() => {
                        setActiveCategory(cat.id)
                        setMenuOpen(false)
                      }}
                    >
                      <Icon size={16} />
                      <span>{cat.label}</span>
                      {isActive && <Check size={14} className="category-menu__check" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <button onClick={refresh} className="btn btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
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
      {shouldShowCategory('ai') && (
        <div className="price-card">
          <div className="price-card__header">
            <div className="price-card__icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3>Google AI Pro (18m)</h3>
              <p className="price-card__sub">Gemini Pro subscription</p>
            </div>
            <span className="price-card__category-tag">AI</span>
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
      )}

      {/* Coursera */}
      {shouldShowCategory('coursera') && (
        <div className="price-card">
          <div className="price-card__header">
            <div className="price-card__icon" style={{ background: '#f0f9ff', color: '#0ea5e9' }}>
              <GraduationCap size={20} />
            </div>
            <div>
              <h3>Coursera Plus</h3>
              <p className="price-card__sub">Manual delivery — admin enters credentials on approval</p>
            </div>
            <span className="price-card__category-tag">Coursera</span>
          </div>
          <div className="price-card__body">
            {editing === 'coursera' ? (
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
                  onClick={() => handleSave('coursera', updateCourseraPrice)}
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
                <span className="price-value">{formatPrice(prices.coursera)} ብር</span>
                <button className="btn btn-outline" onClick={() => startEdit('coursera', prices.coursera)}>
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  className={`btn ${prices.courseraInStock ? 'btn-outline' : 'btn-stock-off'}`}
                  onClick={handleStockToggle}
                  disabled={stockSaving}
                  title="Toggle Buy Now availability"
                >
                  <Package size={14} />
                  {stockSaving ? 'Saving…' : prices.courseraInStock ? 'In Stock' : 'Out of Stock'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Telegram Premium */}
      {shouldShowCategory('telegram') && (
        <div className="price-card">
          <div className="price-card__header">
            <div className="price-card__icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
              <Send size={20} />
            </div>
            <div>
              <h3>Telegram Premium</h3>
              <p className="price-card__sub">All duration packages</p>
            </div>
            <span className="price-card__category-tag">Telegram</span>
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
      )}

      {/* Telegram Stars */}
      {shouldShowCategory('telegram') && (
        <div className="price-card">
          <div className="price-card__header">
            <div className="price-card__icon" style={{ background: '#fefce8', color: '#eab308' }}>
              <Star size={20} />
            </div>
            <div>
              <h3>Telegram Stars</h3>
              <p className="price-card__sub">Price per star</p>
            </div>
            <span className="price-card__category-tag">Telegram</span>
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
      )}

      {/* Airtime — Data packages */}
      {shouldShowCategory('airtime_data') && (
        <div className="price-card">
          <div className="price-card__header">
            <div className="price-card__icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
              <Wifi size={20} />
            </div>
            <div>
              <h3>Airtime — Data</h3>
              <p className="price-card__sub">Data bundle packages</p>
            </div>
            <span className="price-card__category-tag">Data</span>
          </div>
          <div className="price-card__body price-card__body--grid">
            {Object.entries(AIRTIME_DATA_LABELS).map(([key, label]) => {
              const currentPrice = prices.airtime?.data?.[key]?.priceInBirr || 0
              const editKey = `airtime_data_${key}`

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
                        onClick={() => handleSave(editKey, (val) => updateAirtimePrice('data', key, val))}
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
      )}

      {/* Airtime — Voice packages */}
      {shouldShowCategory('airtime_voice') && (
        <div className="price-card">
          <div className="price-card__header">
            <div className="price-card__icon" style={{ background: '#fdf2f8', color: '#ec4899' }}>
              <Mic size={20} />
            </div>
            <div>
              <h3>Airtime — Voice</h3>
              <p className="price-card__sub">Voice bundle packages</p>
            </div>
            <span className="price-card__category-tag">Voice</span>
          </div>
          <div className="price-card__body price-card__body--grid">
            {Object.entries(AIRTIME_VOICE_LABELS).map(([key, label]) => {
              const currentPrice = prices.airtime?.voice?.[key]?.priceInBirr || 0
              const editKey = `airtime_voice_${key}`

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
                        onClick={() => handleSave(editKey, (val) => updateAirtimePrice('voice', key, val))}
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
      )}

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
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .price-header__left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .price-header__left h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .price-header__badge {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .price-header__right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        /* Category Menu */
        .category-menu {
          position: relative;
        }

        .category-menu__trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.875rem;
          border-radius: 0.625rem;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #0f172a;
          transition: all 0.15s ease;
          cursor: pointer;
          font-family: inherit;
        }

        .category-menu__trigger:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .category-menu__arrow {
          transition: transform 0.2s ease;
          color: #94a3b8;
        }

        .category-menu__arrow--open {
          transform: rotate(180deg);
        }

        .category-menu__dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          min-width: 200px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          box-shadow: 0 10px 30px -6px rgba(0, 0, 0, 0.15);
          padding: 0.375rem;
          z-index: 50;
          animation: slideDown 0.15s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .category-menu__item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #475569;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.12s ease;
          font-family: inherit;
          text-align: left;
        }

        .category-menu__item:hover {
          background: #f1f5f9;
        }

        .category-menu__item--active {
          background: #eff6ff;
          color: #2563eb;
        }

        .category-menu__item--active:hover {
          background: #dbeafe;
        }

        .category-menu__check {
          margin-left: auto;
          color: #2563eb;
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
          flex-wrap: wrap;
        }

        .price-card__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
          flex-shrink: 0;
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

        .price-card__category-tag {
          margin-left: auto;
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          background: #e2e8f0;
          color: #64748b;
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
          flex-wrap: wrap;
          gap: 0.5rem;
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
          flex-wrap: wrap;
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

        .btn-stock-off {
          border-color: #fecaca;
          color: #dc2626;
          background: #fef2f2;
        }

        .btn-stock-off:hover:not(:disabled) {
          background: #fee2e2;
          border-color: #fca5a5;
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

        @media (max-width: 640px) {
          .price-header {
            flex-direction: column;
            align-items: stretch;
          }

          .price-header__right {
            flex-wrap: wrap;
          }

          .category-menu__dropdown {
            right: auto;
            left: 0;
            min-width: 180px;
          }

          .price-card__header {
            flex-wrap: wrap;
          }

          .price-card__category-tag {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  )
}
