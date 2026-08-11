// src/App.jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { AdminProvider, useAdmin } from './context/AdminContext'
import { Login } from './components/Login'
import { BroadcastPanel } from './components/BroadcastPanel'
import { PriceManagement } from './components/PriceManagement'
import './index.css'
import './App.css'
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
  Tag,
  DollarSign,  // ADD THIS
  GraduationCap,
  Eye,
  EyeOff,
  KeyRound,
  Ban,
  UserCheck,
  Save,
  AlertTriangle,
  Banknote,
  UserPlus,
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
  { key: 'prices', label: 'Prices', icon: DollarSign },  // ADD THIS
  { key: 'withdrawals', label: 'Withdrawals', icon: Banknote },
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
  coursera: { label: 'Coursera Plus', icon: GraduationCap, color: '#0EA5E9' },
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

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${wide ? 'modal--wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3>{title}</h3>
          <button className="modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}

// ============================================
// OVERVIEW COMPONENT
// ============================================

function Overview({ onNavigate }) {
  const { stats, activity, orders, refresh, loading } = useAdmin()
  
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
            <button className="link-btn" onClick={() => onNavigate?.('orders')}>
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

// Row renderer for the Users Overview detail modal — the shape of each
// item differs by which stat card was clicked (user rows vs. withdrawal
// rows vs. referral-bonus order rows).
function OverviewDetailRow({ type, item }) {
  if (type === 'withdrawn') {
    return (
      <>
        <span>#{item.id} · {item.users?.username ? `@${item.users.username}` : (item.users?.name || 'N/A')}</span>
        <span>{Number(item.amount).toLocaleString()} ETB · {new Date(item.updated_at || item.created_at).toLocaleDateString()}</span>
      </>
    )
  }
  if (type === 'referralEarned') {
    return (
      <>
        <span>Order #{item.id} · {item.users?.username ? `@${item.users.username}` : (item.users?.name || 'N/A')}</span>
        <span>+{Number(item.bonus).toLocaleString()} ETB</span>
      </>
    )
  }
  // totalUsers, normalStart, referralJoined — all plain user rows
  return (
    <>
      <span>{item.name || 'Unknown'}{item.username ? ` · @${item.username}` : ''}</span>
      <span>{Number(item.balance || 0).toLocaleString()} ETB</span>
    </>
  )
}

function UsersPanel() {
  const { users, loading, usersOverview, api } = useAdmin()
  const [query, setQuery] = useState("")
  const [detailUser, setDetailUser] = useState(null)
  const [banTarget, setBanTarget] = useState(null)
  const [banReason, setBanReason] = useState('')
  const [banBusy, setBanBusy] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const { banUser, unbanUser } = useAdmin()

  const [overviewDetail, setOverviewDetail] = useState(null) // { type, title }
  const [overviewItems, setOverviewItems] = useState([])
  const [overviewLoading, setOverviewLoading] = useState(false)

  const openOverviewDetail = async (type, title) => {
    setOverviewDetail({ type, title })
    setOverviewLoading(true)
    setOverviewItems([])
    try {
      let items = []
      if (type === 'totalUsers') items = users
      else if (type === 'normalStart') items = await api.getNormalStartUsersList()
      else if (type === 'referralJoined') items = await api.getReferralJoinedUsersList()
      else if (type === 'withdrawn') items = await api.getCompletedWithdrawalsList()
      else if (type === 'referralEarned') items = await api.getReferralEarnedList()
      setOverviewItems(items)
    } catch (err) {
      console.error('Failed to load overview detail:', err)
    } finally {
      setOverviewLoading(false)
    }
  }

  const closeOverviewDetail = () => {
    setOverviewDetail(null)
    setOverviewItems([])
  }

  const filtered = React.useMemo(() =>
    users.filter((u) =>
      `${u.name || ''} ${u.username || ''} ${u.user_id || ''}`.toLowerCase().includes(query.toLowerCase())
    ),
    [users, query]
  )

  const openBanModal = (u) => {
    setBanReason('')
    setBanTarget(u)
  }

  const closeBanModal = () => {
    if (banBusy) return
    setBanTarget(null)
  }

  const confirmBan = async () => {
    if (!banTarget) return
    setBanBusy(true)
    try {
      await banUser(banTarget.user_id, banReason.trim() || null)
      setBanTarget(null)
    } finally {
      setBanBusy(false)
    }
  }

  const handleUnban = async (u) => {
    setBusyId(u.user_id)
    try {
      await unbanUser(u.user_id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="section-stack">
      <Card>
        <SectionHeading eyebrow="Snapshot" title="Users Overview" />
        <div className="stats-grid stats-grid--5">
          <button type="button" className="stat-item" onClick={() => openOverviewDetail('totalUsers', 'All Users')}>
            <p className="stat-value">{usersOverview ? usersOverview.totalUsers.toLocaleString() : '…'}</p>
            <p className="stat-label">👥 Total Users</p>
          </button>
          <button type="button" className="stat-item" onClick={() => openOverviewDetail('referralEarned', 'Referral Earnings (Gemini Pro bonus)')}>
            <p className="stat-value">{usersOverview ? `~${usersOverview.totalReferralEarned.toLocaleString()}` : '…'}</p>
            <p className="stat-label">💰 Total Referral Earned</p>
          </button>
          <button type="button" className="stat-item" onClick={() => openOverviewDetail('withdrawn', 'Completed Withdrawals')}>
            <p className="stat-value">{usersOverview ? usersOverview.totalWithdrawn.toLocaleString() : '…'}</p>
            <p className="stat-label">💸 Total Withdrawn</p>
          </button>
          <button type="button" className="stat-item" onClick={() => openOverviewDetail('normalStart', 'Normal Start Users (No Invite)')}>
            <p className="stat-value">{usersOverview ? usersOverview.normalStartUsers.toLocaleString() : '…'}</p>
            <p className="stat-label">🆕 Normal Start Users (No Invite)</p>
          </button>
          <button type="button" className="stat-item" onClick={() => openOverviewDetail('referralJoined', 'Referral-Joined Users')}>
            <p className="stat-value">{usersOverview ? usersOverview.referralJoinedUsers.toLocaleString() : '…'}</p>
            <p className="stat-label">🔗 Referral-Joined Users</p>
          </button>
        </div>
      </Card>

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
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="empty-row">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="empty-row">No users found</td></tr>
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
                    {u.is_banned ? (
                      <span className="status-dot-pill status-dot-pill--danger">
                        <span className="status-dot status-dot--danger" />
                        Banned
                      </span>
                    ) : (
                      <span className={`status-dot-pill ${u.channels_joined ? 'status-dot-pill--active' : 'status-dot-pill--inactive'}`}>
                        <span className={`status-dot ${u.channels_joined ? 'status-dot--active' : 'status-dot--inactive'}`} />
                        {u.channels_joined ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="row-actions">
                      <button className="btn btn-outline" onClick={() => setDetailUser(u)}>
                        <Eye size={14} />
                        View
                      </button>
                      {u.is_banned ? (
                        <button
                          className="btn btn-outline"
                          disabled={busyId === u.user_id}
                          onClick={() => handleUnban(u)}
                        >
                          <UserCheck size={14} />
                          {busyId === u.user_id ? '...' : 'Unban'}
                        </button>
                      ) : (
                        <button className="btn btn-danger" onClick={() => openBanModal(u)}>
                          <Ban size={14} />
                          Ban
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detailUser && (
        <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} />
      )}

      {overviewDetail && (
        <Modal title={overviewDetail.title} onClose={closeOverviewDetail} wide>
          {overviewLoading ? (
            <p className="modal__hint">Loading…</p>
          ) : overviewItems.length === 0 ? (
            <p className="modal__hint">No records found.</p>
          ) : (
            <div className="user-detail__orders-list" style={{ maxHeight: 380 }}>
              {overviewItems.map((item) => (
                <div key={item.id || item.user_id} className="user-detail__order-row">
                  <OverviewDetailRow type={overviewDetail.type} item={item} />
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {banTarget && (
        <Modal title={`Ban @${banTarget.username || banTarget.user_id}`} onClose={closeBanModal}>
          <p className="modal__hint">
            This blocks every bot interaction for this user immediately — they'll see a
            "your account has been banned" message instead of the menu.
          </p>
          <div className="form-field">
            <label className="form-field__label">Reason (optional, shown to the user)</label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="e.g. Repeated fraudulent orders"
              rows={3}
            />
          </div>
          <div className="modal__actions">
            <button className="btn btn-outline" onClick={closeBanModal} disabled={banBusy}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmBan} disabled={banBusy}>
              {banBusy ? 'Banning...' : 'Ban User'}
            </button>
          </div>
        </Modal>
      )}
    </Card>
    </div>
  )
}

// ============================================
// USER DETAIL MODAL — profile, live balance edit,
// ban/unban, and full order history for one user.
// ============================================

function UserDetailModal({ user, onClose }) {
  const { adjustUserBalance, banUser, unbanUser, getUserOrders } = useAdmin()
  const [balanceInput, setBalanceInput] = useState(String(user.balance ?? 0))
  const [savingBalance, setSavingBalance] = useState(false)
  const [balanceError, setBalanceError] = useState(null)
  const [balanceSaved, setBalanceSaved] = useState(false)

  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState(null)

  const [banBusy, setBanBusy] = useState(false)
  const [showBanReason, setShowBanReason] = useState(false)
  const [banReason, setBanReason] = useState('')

  // Local mirror of ban state so the modal reflects an action taken
  // inside it without waiting for the parent list's realtime update.
  const [isBanned, setIsBanned] = useState(!!user.is_banned)

  useEffect(() => {
    let mounted = true
    setOrdersLoading(true)
    getUserOrders(user.user_id)
      .then((data) => { if (mounted) setOrders(data) })
      .catch((err) => { if (mounted) setOrdersError(err.message) })
      .finally(() => { if (mounted) setOrdersLoading(false) })
    return () => { mounted = false }
  }, [user.user_id, getUserOrders])

  const handleSaveBalance = async () => {
    setBalanceError(null)
    setBalanceSaved(false)
    const amount = Number(balanceInput)
    if (!Number.isFinite(amount) || amount < 0) {
      setBalanceError('Enter a valid, non-negative number.')
      return
    }
    setSavingBalance(true)
    try {
      await adjustUserBalance(user.user_id, amount)
      setBalanceSaved(true)
      setTimeout(() => setBalanceSaved(false), 2000)
    } catch (err) {
      setBalanceError(err.message || 'Failed to save balance')
    } finally {
      setSavingBalance(false)
    }
  }

  const handleBan = async () => {
    setBanBusy(true)
    try {
      await banUser(user.user_id, banReason.trim() || null)
      setIsBanned(true)
      setShowBanReason(false)
    } finally {
      setBanBusy(false)
    }
  }

  const handleUnban = async () => {
    setBanBusy(true)
    try {
      await unbanUser(user.user_id)
      setIsBanned(false)
    } finally {
      setBanBusy(false)
    }
  }

  return (
    <Modal title={user.name || 'User'} onClose={onClose}>
      <div className="user-detail">
        <div className="user-detail__header">
          <div className="user-cell__avatar user-cell__avatar--lg">{user.name?.charAt(0) || 'U'}</div>
          <div>
            <p className="user-cell__name">{user.name || 'Unknown'}</p>
            <p className="user-cell__username">{user.username ? `@${user.username}` : 'no username'}</p>
            <p className="cell-mono" style={{ marginTop: '0.25rem' }}>{user.user_id}</p>
          </div>
          {isBanned && (
            <span className="status-dot-pill status-dot-pill--danger" style={{ marginLeft: 'auto' }}>
              <span className="status-dot status-dot--danger" />
              Banned
            </span>
          )}
        </div>

        <div className="user-detail__stats">
          <div className="stat-item">
            <p className="stat-value">{user.joined_date || 'N/A'}</p>
            <p className="stat-label">Joined</p>
          </div>
          <div className="stat-item">
            <p className="stat-value">{user.referral_count || 0}</p>
            <p className="stat-label">Referrals</p>
          </div>
          <div className="stat-item">
            <p className="stat-value">{orders.length}</p>
            <p className="stat-label">Orders</p>
          </div>
          <div className="stat-item">
            <p className="stat-value">{user.channels_joined ? 'Active' : 'Inactive'}</p>
            <p className="stat-label">Channel Status</p>
          </div>
        </div>

        {isBanned && user.ban_reason && (
          <div className="broadcast-alert broadcast-alert--warning" style={{ marginBottom: '1rem' }}>
            <AlertTriangle size={16} />
            <p>Ban reason: {user.ban_reason}</p>
          </div>
        )}

        <div className="form-field">
          <label className="form-field__label">Balance (ETB)</label>
          <div className="code-input">
            <input
              type="number"
              min="0"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              disabled={savingBalance}
            />
            <button className="btn btn-primary" onClick={handleSaveBalance} disabled={savingBalance}>
              <Save size={14} />
              {savingBalance ? 'Saving...' : 'Save'}
            </button>
          </div>
          {balanceError && <p className="field-error">{balanceError}</p>}
          {balanceSaved && <p className="stat-label" style={{ color: 'var(--success)' }}>Balance updated ✓</p>}
        </div>

        {user.withdrawal_method_display && (
          <div className="form-field">
            <label className="form-field__label">Withdrawal Account</label>
            <p className="cell-muted" style={{ margin: 0 }}>
              {user.withdrawal_method_display} — {user.withdrawal_account_name || 'N/A'} ({user.withdrawal_account_number || 'N/A'})
            </p>
          </div>
        )}

        <div className="user-detail__orders">
          <p className="form-field__label" style={{ marginBottom: '0.5rem', display: 'block' }}>Order History</p>
          {ordersLoading ? (
            <p className="cell-muted">Loading orders…</p>
          ) : ordersError ? (
            <p className="field-error">{ordersError}</p>
          ) : orders.length === 0 ? (
            <p className="cell-muted">No orders yet.</p>
          ) : (
            <div className="user-detail__orders-list">
              {orders.slice(0, 8).map((o) => (
                <div key={o.id} className="user-detail__order-row">
                  <ServiceTag service={o.order_type} />
                  <span className="cell-muted">{o.price_display || `${o.price} ETB`}</span>
                  <StatusPill status={o.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {showBanReason ? (
          <div className="form-field">
            <label className="form-field__label">Ban reason (optional)</label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={2}
              disabled={banBusy}
            />
          </div>
        ) : null}

        <div className="modal__actions">
          {isBanned ? (
            <button className="btn btn-outline" onClick={handleUnban} disabled={banBusy}>
              <UserCheck size={14} />
              {banBusy ? 'Unbanning...' : 'Unban User'}
            </button>
          ) : showBanReason ? (
            <button className="btn btn-danger" onClick={handleBan} disabled={banBusy}>
              <Ban size={14} />
              {banBusy ? 'Banning...' : 'Confirm Ban'}
            </button>
          ) : (
            <button className="btn btn-danger" onClick={() => setShowBanReason(true)}>
              <Ban size={14} />
              Ban User
            </button>
          )}
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================
// ORDERS COMPONENT
// ============================================

function OrdersPanel() {
  const { orders, refresh, updateOrderStatus, rejectOrder, approveCourseraOrder } = useAdmin()
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [credsTarget, setCredsTarget] = useState(null)
  const [credsEmail, setCredsEmail] = useState('')
  const [credsPassword, setCredsPassword] = useState('')
  const [credsShowPassword, setCredsShowPassword] = useState(false)
  const [credsSaving, setCredsSaving] = useState(false)
  const [credsError, setCredsError] = useState(null)

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter)

  const counts = ['pending', 'approved', 'completed', 'rejected'].map(s => ({
    status: s,
    count: orders.filter(o => o.status === s).length,
  }))

  const handleStatusChange = async (orderId, status) => {
    setBusyId(orderId)
    try {
      await updateOrderStatus(orderId, status)
    } finally {
      setBusyId(null)
    }
  }

  const openRejectModal = (order) => {
    setRejectReason('')
    setRejectTarget(order)
  }

  const openCredsModal = (order) => {
    setCredsEmail('')
    setCredsPassword('')
    setCredsShowPassword(false)
    setCredsError(null)
    setCredsTarget(order)
  }

  const closeCredsModal = () => {
    if (credsSaving) return
    setCredsTarget(null)
  }

  const confirmCreds = async () => {
    if (!credsTarget) return
    const email = credsEmail.trim()
    const password = credsPassword.trim()

    if (!email.includes('@') || !email.includes('.')) {
      setCredsError('Enter a valid email address.')
      return
    }
    if (!password) {
      setCredsError('Enter the account password.')
      return
    }

    setCredsSaving(true)
    setCredsError(null)
    try {
      await approveCourseraOrder(credsTarget.id, email, password)
      setCredsTarget(null)
    } catch (err) {
      setCredsError(err.message || 'Failed to approve order')
    } finally {
      setCredsSaving(false)
    }
  }

  const closeRejectModal = () => {
    if (rejecting) return
    setRejectTarget(null)
  }

  const confirmReject = async () => {
    if (!rejectTarget) return
    setRejecting(true)
    try {
      await rejectOrder(rejectTarget.id, rejectReason.trim())
      setRejectTarget(null)
    } finally {
      setRejecting(false)
    }
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
                          {o.order_type === 'coursera' ? (
                            <button
                              className="btn btn-primary"
                              onClick={() => openCredsModal(o)}
                            >
                              <KeyRound size={14} />
                              Enter Details
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary"
                              disabled={busyId === o.id}
                              onClick={() => handleStatusChange(o.id, 'approved')}
                            >
                              {busyId === o.id ? 'Approving...' : 'Approve'}
                            </button>
                          )}
                          <button
                            className="btn btn-outline btn-danger"
                            disabled={busyId === o.id}
                            onClick={() => openRejectModal(o)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {o.status === 'approved' && (
                        <button
                          className="btn btn-primary"
                          disabled={busyId === o.id}
                          onClick={() => handleStatusChange(o.id, 'completed')}
                        >
                          {busyId === o.id ? 'Completing...' : 'Complete'}
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

      {rejectTarget && (
        <Modal title={`Reject Order #${rejectTarget.id}`} onClose={closeRejectModal}>
          <p className="modal__hint">
            This user will be notified by Telegram DM. Adding a reason helps them understand why —
            it's optional but recommended.
          </p>
          <div className="form-field">
            <label className="form-field__label">Reason (optional)</label>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Payment screenshot didn't match the amount ordered"
              autoFocus
            />
          </div>
          <div className="modal__actions">
            <button className="btn btn-outline" onClick={closeRejectModal} disabled={rejecting}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={confirmReject} disabled={rejecting}>
              {rejecting ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          </div>
        </Modal>
      )}

      {credsTarget && (
        <Modal title={`Coursera Order #${credsTarget.id} — Account Details`} onClose={closeCredsModal}>
          <p className="modal__hint">
            Enter the Coursera account email and password for this user. Approving will mark the
            order as approved and DM these credentials to the user immediately.
          </p>
          <div className="form-field">
            <label className="form-field__label">Coursera Email</label>
            <input
              type="email"
              value={credsEmail}
              onChange={(e) => setCredsEmail(e.target.value)}
              placeholder="user@example.com"
              autoFocus
              disabled={credsSaving}
            />
          </div>
          <div className="form-field">
            <label className="form-field__label">Coursera Password</label>
            <div className="password-input-wrapper">
              <input
                type={credsShowPassword ? 'text' : 'password'}
                value={credsPassword}
                onChange={(e) => setCredsPassword(e.target.value)}
                placeholder="Account password"
                disabled={credsSaving}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setCredsShowPassword(!credsShowPassword)}
                aria-label={credsShowPassword ? 'Hide password' : 'Show password'}
              >
                {credsShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {credsError && <p className="field-error">{credsError}</p>}
          <div className="modal__actions">
            <button className="btn btn-outline" onClick={closeCredsModal} disabled={credsSaving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={confirmCreds} disabled={credsSaving}>
              {credsSaving ? 'Sending…' : 'Approve & Send'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ============================================
// WITHDRAWALS COMPONENT
// ============================================

function WithdrawalsPanel() {
  const { withdrawals, refresh, completeWithdrawal, rejectWithdrawal } = useAdmin()
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  const filteredWithdrawals = filter === 'all'
    ? withdrawals
    : withdrawals.filter(w => w.status === filter)

  const counts = ['pending', 'completed', 'rejected'].map(s => ({
    status: s,
    count: withdrawals.filter(w => w.status === s).length,
  }))

  const handleComplete = async (withdrawalId) => {
    setBusyId(withdrawalId)
    try {
      await completeWithdrawal(withdrawalId)
    } finally {
      setBusyId(null)
    }
  }

  const openRejectModal = (w) => {
    setRejectReason('')
    setRejectTarget(w)
  }

  const closeRejectModal = () => {
    if (rejecting) return
    setRejectTarget(null)
  }

  const confirmReject = async () => {
    if (!rejectTarget) return
    setRejecting(true)
    try {
      await rejectWithdrawal(rejectTarget.id, rejectReason.trim())
      setRejectTarget(null)
    } finally {
      setRejecting(false)
    }
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
          eyebrow={`${filteredWithdrawals.length} withdrawals`}
          title="Withdrawals"
          action={
            <div className="orders-actions">
              <button onClick={refresh} className="link-btn">
                <RefreshCw size={16} />
              </button>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          }
        />
        <div className="table-scroll">
          <table className="data-table data-table--min-720">
            <thead>
              <tr>
                <th>Withdrawal</th>
                <th>User</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Account</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.length === 0 ? (
                <tr><td colSpan={8} className="empty-row">No withdrawals found</td></tr>
              ) : (
                filteredWithdrawals.slice(0, 20).map((w) => (
                  <tr key={w.id}>
                    <td className="cell-strong">#{w.id}</td>
                    <td className="cell-muted">{w.users?.username ? `@${w.users.username}` : (w.users?.name || 'N/A')}</td>
                    <td className="cell-muted">{Number(w.amount).toLocaleString()} ETB</td>
                    <td className="cell-muted">{w.method_display || w.method || 'N/A'}</td>
                    <td className="cell-mono">{w.account_name} · {w.account_number}</td>
                    <td className="cell-muted">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td><StatusPill status={w.status} /></td>
                    <td className="text-right">
                      {w.status === 'pending' && (
                        <div className="row-actions">
                          <button
                            className="btn btn-primary"
                            disabled={busyId === w.id}
                            onClick={() => handleComplete(w.id)}
                          >
                            {busyId === w.id ? 'Paying…' : 'Mark Paid'}
                          </button>
                          <button
                            className="btn btn-outline btn-danger"
                            disabled={busyId === w.id}
                            onClick={() => openRejectModal(w)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {rejectTarget && (
        <Modal title={`Reject Withdrawal #${rejectTarget.id}`} onClose={closeRejectModal}>
          <p className="modal__hint">
            The {Number(rejectTarget.amount).toLocaleString()} ETB reserved for this request will be
            refunded to the user's balance automatically, and they'll be notified by Telegram DM.
          </p>
          <div className="form-field">
            <label className="form-field__label">Reason (optional)</label>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Account details couldn't be verified"
              autoFocus
            />
          </div>
          <div className="modal__actions">
            <button className="btn btn-outline" onClick={closeRejectModal} disabled={rejecting}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={confirmReject} disabled={rejecting}>
              {rejecting ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          </div>
        </Modal>
      )}
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
      case 'overview': return <Overview onNavigate={setActive} />
      case 'users': return <UsersPanel />
      case 'orders': return <OrdersPanel />
      case 'coupons': return <CouponsPanel />
      case 'prices': return <PriceManagement />
      case 'withdrawals': return <WithdrawalsPanel />
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
