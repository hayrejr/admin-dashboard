// src/App.jsx
import React, { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { AdminProvider, useAdmin } from './context/AdminContext'
import { Login } from './components/Login'
import './index.css'
import {
  LayoutDashboard,
  Users,
  Package,
  Share2,
  BarChart3,
  Settings as SettingsIcon,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Sparkles,
  Send,
  Star,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  PartyPopper,
  Shield,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Copy,
  Filter,
  Download,
  Tag, // <- ADD THIS MISSING IMPORT
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// ============================================
// NAVIGATION
// ============================================

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'orders', label: 'Orders', icon: Package },
  { key: 'coupons', label: 'Coupons', icon: Tag },
  { key: 'referrals', label: 'Referrals', icon: Share2 },
  { key: 'broadcast', label: 'Broadcast', icon: Send },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
]

// ============================================
// SERVICE & STATUS META
// ============================================

const SERVICE_META = {
  gemini_pro: { label: 'Gemini AI Pro', icon: Sparkles, color: '#2563EB' },
  telegram_premium: { label: 'Telegram Premium', icon: Send, color: '#3B82F6' },
  telegram_stars: { label: 'Telegram Stars', icon: Star, color: '#60A5FA' },
  usdt_sell: { label: 'USDT Sell', icon: Wallet, color: '#1D4ED8' },
}

const STATUS_META = {
  pending: { label: 'Pending', icon: Clock, cls: 'pending' },
  approved: { label: 'Approved', icon: CheckCircle2, cls: 'approved' },
  completed: { label: 'Completed', icon: PartyPopper, cls: 'completed' },
  rejected: { label: 'Rejected', icon: XCircle, cls: 'rejected' },
}

// ============================================
// UI PRIMITIVES
// ============================================

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending
  const Icon = meta.icon
  return (
    <span className={`status-pill status-pill--${meta.cls}`}>
      <Icon size={14} />
      {meta.label}
    </span>
  )
}

function ServiceTag({ service }) {
  const meta = SERVICE_META[service]
  if (!meta) return <span className="cell-muted">{service}</span>
  const Icon = meta.icon
  return (
    <span className="service-tag">
      <Icon size={14} style={{ color: meta.color }} />
      {meta.label}
    </span>
  )
}

function Card({ className = '', children }) {
  return <div className={`card card--pad ${className}`}>{children}</div>
}

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="section-heading__eyebrow">{eyebrow}</p>}
        <h2 className="section-heading__title">{title}</h2>
      </div>
      {action}
    </div>
  )
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <button onClick={() => onChange(!checked)} className="toggle-row">
      <div>
        <p className="toggle-row__label">{label}</p>
        {description && <p className="toggle-row__desc">{description}</p>}
      </div>
      {checked ? (
        <ToggleRight className="toggle-row__icon toggle-row__icon--on" size={32} />
      ) : (
        <ToggleLeft className="toggle-row__icon" size={32} />
      )}
    </button>
  )
}

// ============================================
// OVERVIEW COMPONENT
// ============================================

function Overview() {
  const { stats, activity, orders, refresh, loading } = useAdmin()
  const [active, setActive] = useState('overview')
  
  const kpiCards = [
    { 
      label: 'Total Users', 
      value: stats?.totalUsers?.toLocaleString() || '0', 
      icon: Users 
    },
    { 
      label: 'Total Orders', 
      value: stats?.totalOrders?.toString() || '0', 
      icon: Package 
    },
    { 
      label: 'Pending Orders', 
      value: stats?.pendingOrders?.toString() || '0', 
      icon: Clock 
    },
    { 
      label: 'Total Revenue (ETB)', 
      value: stats?.totalBalance?.toLocaleString() || '0', 
      icon: Wallet 
    },
  ]

  return (
    <div className="section-stack">
      <div className="kpi-grid">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <div className="kpi-card__top">
                <div className="kpi-card__icon-wrap">
                  <Icon size={20} />
                </div>
              </div>
              <p className="kpi-card__value">{loading ? '...' : card.value}</p>
              <p className="kpi-card__label">{card.label}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid-charts">
        <Card>
          <SectionHeading 
            eyebrow="This week" 
            title="Activity" 
            action={
              <button onClick={refresh} className="link-btn">
                <RefreshCw size={16} />
                Refresh
              </button>
            }
          />
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="msgFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13 }}
                  labelStyle={{ fontWeight: 600, color: '#0F172A' }}
                />
                <Area type="monotone" dataKey="messages" stroke="#2563EB" strokeWidth={2.5} fill="url(#msgFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionHeading eyebrow="Split" title="Orders by Service" />
          <div className="chart-box--sm">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Gemini Pro', value: stats?.geminiOrders || 0 },
                    { name: 'Premium', value: stats?.premiumOrders || 0 },
                    { name: 'Stars', value: stats?.starsOrders || 0 },
                    { name: 'USDT', value: stats?.usdtOrders || 0 },
                  ].filter(d => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {[
                    { name: 'Gemini Pro', color: '#2563EB' },
                    { name: 'Premium', color: '#3B82F6' },
                    { name: 'Stars', color: '#60A5FA' },
                    { name: 'USDT', color: '#1D4ED8' },
                  ].filter((d, i) => {
                    const vals = [
                      stats?.geminiOrders || 0,
                      stats?.premiumOrders || 0,
                      stats?.starsOrders || 0,
                      stats?.usdtOrders || 0,
                    ]
                    return vals[i] > 0
                  }).map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            {[
              { name: 'Gemini Pro', value: stats?.geminiOrders || 0, color: '#2563EB' },
              { name: 'Premium', value: stats?.premiumOrders || 0, color: '#3B82F6' },
              { name: 'Stars', value: stats?.starsOrders || 0, color: '#60A5FA' },
              { name: 'USDT', value: stats?.usdtOrders || 0, color: '#1D4ED8' },
            ].filter(d => d.value > 0).map((s) => (
              <div key={s.name} className="legend__row">
                <span className="legend__label">
                  <span className="legend__dot" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="legend__value">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeading
          eyebrow="Recent"
          title="Pending Orders"
          action={
            <button className="link-btn" onClick={() => setActive('orders')}>
              View all <ChevronRight size={16} />
            </button>
          }
        />
        <div className="table-scroll">
          <table className="data-table data-table--min-560">
            <thead>
              <tr>
                <th>Order</th>
                <th>User</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.filter(o => o.status === 'pending').slice(0, 5).map((o) => (
                <tr key={o.id}>
                  <td className="cell-strong">#{o.id}</td>
                  <td className="cell-muted">{o.users?.username ? `@${o.users.username}` : 'N/A'}</td>
                  <td><ServiceTag service={o.order_type} /></td>
                  <td className="cell-muted">{o.price_display || `${o.price} ETB`}</td>
                  <td><StatusPill status={o.status} /></td>
                </tr>
              ))}
              {orders.filter(o => o.status === 'pending').length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-row">No pending orders</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ============================================
// USERS COMPONENT
// ============================================

function UsersPanel() {
  const { users, loading, refresh } = useAdmin()
  const [query, setQuery] = useState("")
  
  const filtered = React.useMemo(() =>
    users.filter((u) =>
      `${u.name || ''} ${u.username || ''} ${u.user_id || ''}`.toLowerCase().includes(query.toLowerCase())
    ),
    [users, query]
  )

  return (
    <Card>
      <SectionHeading
        eyebrow={`${users.length} users`}
        title="Users"
        action={
          <div className="users-search">
            <Search size={16} className="search-box__icon" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
            />
          </div>
        }
      />
      <div className="table-scroll">
        <table className="data-table data-table--min-720">
          <thead>
            <tr>
              <th>User</th>
              <th>ID</th>
              <th>Joined</th>
              <th>Orders</th>
              <th>Balance</th>
              <th>Referrals</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="empty-row">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="empty-row">No users found</td></tr>
            ) : (
              filtered.slice(0, 20).map((u) => (
                <tr key={u.user_id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-cell__avatar">{u.name?.charAt(0) || 'U'}</div>
                      <div>
                        <p className="user-cell__name">{u.name || 'Unknown'}</p>
                        <p className="user-cell__username">{u.username ? `@${u.username}` : 'no username'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="cell-mono">{u.user_id?.slice(0, 8)}...</td>
                  <td className="cell-muted">{u.joined_date || 'N/A'}</td>
                  <td className="cell-muted">{u.order_count || 0}</td>
                  <td className="cell-muted">{u.balance || 0}</td>
                  <td className="cell-muted">{u.referral_count || 0}</td>
                  <td>
                    <span className={`status-dot-pill ${u.channels_joined ? 'status-dot-pill--active' : 'status-dot-pill--inactive'}`}>
                      <span className={`status-dot ${u.channels_joined ? 'status-dot--active' : 'status-dot--inactive'}`} />
                      {u.channels_joined ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ============================================
// ORDERS COMPONENT
// ============================================

function OrdersPanel() {
  const { orders, refresh, updateOrderStatus } = useAdmin()
  const [filter, setFilter] = useState('all')

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter)

  const counts = ['pending', 'approved', 'completed', 'rejected'].map(s => ({
    status: s,
    count: orders.filter(o => o.status === s).length,
  }))

  const handleStatusChange = async (orderId, status) => {
    await updateOrderStatus(orderId, status)
  }

  return (
    <div className="section-stack">
      <div className="status-summary-grid">
        {counts.map((c) => {
          const meta = STATUS_META[c.status]
          const Icon = meta.icon
          return (
            <Card key={c.status} className="status-summary-card" onClick={() => setFilter(c.status)}>
              <div className={`status-summary-card__icon icon-bg--${meta.cls}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="status-summary-card__count">{c.count}</p>
                <p className="status-summary-card__label">{meta.label}</p>
              </div>
            </Card>
          )
        })}
      </div>

      <Card>
        <SectionHeading 
          eyebrow={`${filteredOrders.length} orders`}
          title="Orders"
          action={
            <div className="orders-actions">
              <button onClick={refresh} className="link-btn">
                <RefreshCw size={16} />
              </button>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          }
        />
        <div className="table-scroll">
          <table className="data-table data-table--min-640">
            <thead>
              <tr>
                <th>Order</th>
                <th>User</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={7} className="empty-row">No orders found</td></tr>
              ) : (
                filteredOrders.slice(0, 10).map((o) => (
                  <tr key={o.id}>
                    <td className="cell-strong">#{o.id}</td>
                    <td className="cell-muted">{o.users?.username ? `@${o.users.username}` : 'N/A'}</td>
                    <td><ServiceTag service={o.order_type} /></td>
                    <td className="cell-muted">{o.price_display || `${o.price} ETB`}</td>
                    <td className="cell-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td><StatusPill status={o.status} /></td>
                    <td className="text-right">
                      {o.status === 'pending' && (
                        <div className="row-actions">
                          <button className="btn btn-primary" onClick={() => handleStatusChange(o.id, 'approved')}>
                            Approve
                          </button>
                          <button className="btn btn-outline" onClick={() => handleStatusChange(o.id, 'rejected')}>
                            Reject
                          </button>
                        </div>
                      )}
                      {o.status === 'approved' && (
                        <button className="btn btn-primary" onClick={() => handleStatusChange(o.id, 'completed')}>
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ============================================
// COUPONS COMPONENT
// ============================================

function CouponsPanel() {
  const { coupons, loading, refresh, createCoupon, deleteCoupon } = useAdmin()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    discount_percent: 10,
    max_uses: 0,
    expiry_date: ''
  })

  const handleCreate = async (e) => {
    e.preventDefault()
    await createCoupon(formData)
    setShowCreateForm(false)
    setFormData({ code: '', discount_percent: 10, max_uses: 0, expiry_date: '' })
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, code }))
  }

  return (
    <div className="section-stack">
      <Card>
        <SectionHeading
          eyebrow={`${coupons.length} coupons`}
          title="Coupons"
          action={
            <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus size={16} /> New Coupon
            </button>
          }
        />
        
        {showCreateForm && (
          <div className="coupon-form">
            <h4>Create New Coupon</h4>
            <form onSubmit={handleCreate} className="form-grid">
              <div className="form-field">
                <label>Code</label>
                <div className="code-input">
                  <input
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="COUPON123"
                    required
                  />
                  <button type="button" className="btn btn-outline" onClick={generateCode}>
                    Generate
                  </button>
                </div>
              </div>
              <div className="form-field">
                <label>Discount %</label>
                <input
                  type="number"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_percent: parseInt(e.target.value) }))}
                  min="1"
                  max="100"
                  required
                />
              </div>
              <div className="form-field">
                <label>Max Uses (0 = unlimited)</label>
                <input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_uses: parseInt(e.target.value) }))}
                  min="0"
                />
              </div>
              <div className="form-field">
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Create</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Uses</th>
                <th>Max Uses</th>
                <th>Expiry</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="empty-row">Loading...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={7} className="empty-row">No coupons</td></tr>
              ) : (
                coupons.map((c) => {
                  const isExpired = c.expiry_date && new Date(c.expiry_date) < new Date()
                  const isUsedUp = c.max_uses > 0 && c.used_count >= c.max_uses
                  const isActive = !isExpired && !isUsedUp
                  
                  return (
                    <tr key={c.id}>
                      <td><code>{c.code}</code></td>
                      <td>{c.discount_percent}%</td>
                      <td>{c.used_count}</td>
                      <td>{c.max_uses || '∞'}</td>
                      <td>{c.expiry_date || 'Never'}</td>
                      <td>
                        <span className={`status-dot-pill ${isActive ? 'status-dot-pill--active' : 'status-dot-pill--inactive'}`}>
                          <span className={`status-dot ${isActive ? 'status-dot--active' : 'status-dot--inactive'}`} />
                          {isActive ? 'Active' : isExpired ? 'Expired' : 'Used Up'}
                        </span>
                      </td>
                      <td className="text-right">
                        <button className="row-menu-btn" onClick={() => deleteCoupon(c.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ============================================
// REFERRALS COMPONENT
// ============================================

function ReferralsPanel() {
  const { referrers, stats, loading, refresh } = useAdmin()

  return (
    <div className="referrals-grid">
      <Card>
        <SectionHeading 
          eyebrow="Leaderboard" 
          title="Top Referrers"
          action={
            <button onClick={refresh} className="link-btn">
              <RefreshCw size={16} />
            </button>
          }
        />
        <div className="referral-list">
          {loading ? (
            <div className="empty-row">Loading...</div>
          ) : referrers.length === 0 ? (
            <div className="empty-row">No referrers yet</div>
          ) : (
            referrers.map((r, index) => (
              <div key={r.user_id} className="referral-row">
                <div className="referral-row__left">
                  <span className={`referral-rank ${index === 0 ? 'referral-rank--gold' : index <= 2 ? 'referral-rank--top3' : ''}`}>
                    {index + 1}
                  </span>
                  <p className="referral-row__name">
                    {r.username ? `@${r.username}` : (r.name || `ID ${r.user_id?.slice(0, 8)}`)}
                  </p>
                </div>
                <p className="referral-row__invites">{r.referral_count || 0} invites</p>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <SectionHeading eyebrow="Stats" title="Referral Overview" />
        <div className="stats-grid">
          <div className="stat-item">
            <p className="stat-value">{stats?.totalReferrals || 0}</p>
            <p className="stat-label">Total Invites</p>
          </div>
          <div className="stat-item">
            <p className="stat-value">{stats?.totalReferredUsers || 0}</p>
            <p className="stat-label">Referred Users</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ============================================
// BROADCAST COMPONENT
// ============================================

function BroadcastPanel() {
  const [text, setText] = useState('')
  const [photoFileId, setPhotoFileId] = useState('')
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const { api } = useAdmin()

  const handleSend = async () => {
    if (!text.trim()) return
    
    setSending(true)
    setProgress(0)
    setResult(null)
    
    try {
      const response = await api.sendBroadcastMessage(text, photoFileId, null)
      setResult(response)
    } catch (error) {
      setResult({ sent: 0, failed: 1, total: 1, error: error.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="broadcast-panel">
      <Card>
        <SectionHeading eyebrow="Send" title="Broadcast Message" />
        
        <div className="broadcast-form">
          <div className="form-field">
            <label>Message Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your broadcast message here..."
              rows={6}
            />
          </div>
          
          <div className="form-field">
            <label>Photo File ID (optional)</label>
            <input
              value={photoFileId}
              onChange={(e) => setPhotoFileId(e.target.value)}
              placeholder="Telegram photo file ID"
            />
          </div>
          
          <div className="broadcast-actions">
            <button 
              className="btn btn-primary" 
              onClick={handleSend}
              disabled={sending || !text.trim()}
            >
              {sending ? 'Sending...' : 'Send Broadcast'}
            </button>
          </div>
          
          {sending && (
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
              <span>{progress}%</span>
            </div>
          )}
          
          {result && (
            <div className={`broadcast-result ${result.error ? 'error' : 'success'}`}>
              {result.error ? (
                <p>❌ Error: {result.error}</p>
              ) : (
                <p>
                  ✅ Broadcast complete!<br />
                  Sent: {result.sent} | Failed: {result.failed} | Total: {result.total}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// ============================================
// SETTINGS COMPONENT
// ============================================

function SettingsPanel() {
  const { settings, updateSetting } = useAdmin()
  const [saving, setSaving] = useState(false)

  const handleToggle = async (key, value) => {
    setSaving(true)
    try {
      await updateSetting(key, value ? '1' : '0')
    } finally {
      setSaving(false)
    }
  }

  const handleNumberChange = async (key, value) => {
    setSaving(true)
    try {
      await updateSetting(key, String(value))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-grid">
      <Card>
        <SectionHeading eyebrow="Controls" title="Bot Settings" />
        <div className="toggle-stack">
          <Toggle
            checked={settings.new_user_notify === '1'}
            onChange={(val) => handleToggle('new_user_notify', val)}
            label="New User Notifications"
            description="Alert admin when new users join"
          />
          <Toggle
            checked={settings.auto_reply === '1'}
            onChange={(val) => handleToggle('auto_reply', val)}
            label="Auto Reply"
            description="Auto-respond to support messages"
          />
          <Toggle
            checked={settings.maintenance_mode === '1'}
            onChange={(val) => handleToggle('maintenance_mode', val)}
            label="Maintenance Mode"
            description="Pause new orders"
          />
          <Toggle
            checked={settings.analytics_enabled === '1'}
            onChange={(val) => handleToggle('analytics_enabled', val)}
            label="Analytics"
            description="Track usage for dashboard"
          />
        </div>
      </Card>

      <Card>
        <SectionHeading eyebrow="Referrals" title="Referral Settings" />
        <div className="form-stack">
          <div className="form-field">
            <label>Invites per Milestone</label>
            <input
              type="number"
              value={settings.referral_milestone_step || 10}
              onChange={(e) => handleNumberChange('referral_milestone_step', parseInt(e.target.value))}
              min="1"
            />
          </div>
          <div className="form-field">
            <label>Reward Note</label>
            <input
              type="text"
              value={settings.referral_reward_note || 'Contact admin for your reward!'}
              onChange={(e) => updateSetting('referral_reward_note', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Discount %</label>
            <input
              type="number"
              value={settings.referral_discount_percent || 10}
              onChange={(e) => handleNumberChange('referral_discount_percent', parseInt(e.target.value))}
              min="1"
              max="100"
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

// ============================================
// MAIN APP
// ============================================

function DashboardContent() {
  const [active, setActive] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const { user, signOut } = useAuth()
  const { notifications, refresh, refreshing, error, markNotificationRead, markAllNotificationsRead } = useAdmin()

  const renderSection = () => {
    switch (active) {
      case 'overview': return <Overview />
      case 'users': return <UsersPanel />
      case 'orders': return <OrdersPanel />
      case 'coupons': return <CouponsPanel />
      case 'referrals': return <ReferralsPanel />
      case 'broadcast': return <BroadcastPanel />
      case 'settings': return <SettingsPanel />
      default: return <Overview />
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="app-shell">
      {sidebarOpen && <div className="app-shell__overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__top">
          <div className="sidebar__brand">
            <div className="sidebar__logo">N+</div>
            <div>
              <p className="sidebar__brand-name">NovaPlus</p>
              <p className="sidebar__brand-sub">Admin Console</p>
            </div>
          </div>
          <button className="sidebar__close" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = active === item.key
            return (
              <button
                key={item.key}
                onClick={() => { setActive(item.key); setSidebarOpen(false) }}
                className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="admin-card">
            <div className="admin-card__avatar">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="admin-card__meta">
              <p className="admin-card__name">{user?.email || 'Admin'}</p>
              <button onClick={signOut} className="admin-card__logout">Sign Out</button>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar__left">
            <button className="topbar__menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div>
              <p className="topbar__breadcrumb">Dashboard / {NAV_ITEMS.find(n => n.key === active)?.label}</p>
              <h1 className="topbar__title">{NAV_ITEMS.find(n => n.key === active)?.label}</h1>
            </div>
          </div>
          <div className="topbar__right">
            <button 
              className="icon-btn" 
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="icon-btn__badge">{unreadCount}</span>}
            </button>
            <button className="icon-btn" onClick={refresh} title="Refresh">
              <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
            </button>
          </div>
        </header>

        {showNotifications && (
          <div className="notification-dropdown">
            <div className="notification-dropdown__header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button className="link-btn" onClick={markAllNotificationsRead}>
                  Mark all read
                </button>
              )}
            </div>
            <div className="notification-dropdown__list">
              {notifications.length === 0 ? (
                <p className="notification-empty">No notifications</p>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div 
                    key={n.id} 
                    className={`notification-item ${n.read ? 'notification-item--read' : ''}`}
                    onClick={() => markNotificationRead(n.id)}
                  >
                    <div className="notification-item__icon">{n.type === 'order' ? '📦' : '👤'}</div>
                    <div>
                      <p className="notification-item__title">{n.title}</p>
                      <p className="notification-item__message">{n.message}</p>
                      <p className="notification-item__time">
                        {new Date(n.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <main className="content">
          {error ? (
            <div className="error-state">
              <p>⚠️ {error}</p>
              <button onClick={refresh} className="btn btn-primary">Retry</button>
            </div>
          ) : (
            renderSection()
          )}
        </main>
      </div>
    </div>
  )
}

// ============================================
// EXPORT
// ============================================

export default function App() {
  const { user, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <AdminProvider>
      <DashboardContent />
    </AdminProvider>
  )
}