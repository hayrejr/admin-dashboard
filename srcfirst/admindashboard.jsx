import React, { useState, useMemo } from "react";
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
} from "lucide-react";
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
} from "recharts";

/* -------------------------------------------------------------------------
   MOCK DATA
   Modeled on the bot's real schema: users, orders (gemini / telegram
   premium / telegram stars / usdt), referrals, and admin/bot settings.
--------------------------------------------------------------------------*/

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "users", label: "Active Users", icon: Users },
  { key: "orders", label: "Orders", icon: Package },
  { key: "referrals", label: "Referrals", icon: Share2 },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "settings", label: "Bot Settings", icon: SettingsIcon },
];

const SERVICE_META = {
  gemini: { label: "Gemini AI Pro", icon: Sparkles, color: "#2563EB" },
  telegram_premium: { label: "Telegram Premium", icon: Send, color: "#3B82F6" },
  telegram_stars: { label: "Telegram Stars", icon: Star, color: "#60A5FA" },
  usdt_sell: { label: "USDT Sell", icon: Wallet, color: "#1D4ED8" },
};

const STATUS_META = {
  pending: { label: "Pending", icon: Clock, className: "text-amber-600 bg-amber-50 ring-amber-200" },
  approved: { label: "Approved", icon: CheckCircle2, className: "text-blue-600 bg-blue-50 ring-blue-200" },
  completed: { label: "Completed", icon: PartyPopper, className: "text-emerald-600 bg-emerald-50 ring-emerald-200" },
  rejected: { label: "Rejected", icon: XCircle, className: "text-rose-600 bg-rose-50 ring-rose-200" },
};

const KPI_CARDS = [
  { label: "Total Users", value: "8,214", delta: "+4.6%", up: true, icon: Users },
  { label: "Active Today", value: "1,032", delta: "+1.2%", up: true, icon: TrendingUp },
  { label: "Pending Orders", value: "27", delta: "-3 vs yesterday", up: false, icon: Package },
  { label: "Est. Revenue (ETB)", value: "184,300", delta: "+9.8%", up: true, icon: Wallet },
];

const MESSAGE_ACTIVITY = [
  { day: "Mon", messages: 3200, orders: 42 },
  { day: "Tue", messages: 3980, orders: 51 },
  { day: "Wed", messages: 3510, orders: 47 },
  { day: "Thu", messages: 4720, orders: 63 },
  { day: "Fri", messages: 5230, orders: 71 },
  { day: "Sat", messages: 4870, orders: 68 },
  { day: "Sun", messages: 4120, orders: 55 },
];

const SERVICE_SPLIT = [
  { name: "Gemini AI Pro", value: 38, color: "#2563EB" },
  { name: "Telegram Premium", value: 27, color: "#3B82F6" },
  { name: "Telegram Stars", value: 22, color: "#60A5FA" },
  { name: "USDT Sell", value: 13, color: "#1D4ED8" },
];

const USERS = [
  { id: "5522724001", name: "Abel Tesfaye", username: "abelt", joined: "2026-01-14", orders: 12, balance: 640, status: "active" },
  { id: "6017732844", name: "Selam G.", username: "selamg", joined: "2026-02-02", orders: 4, balance: 0, status: "active" },
  { id: "5981823110", name: "Nahom K.", username: null, joined: "2026-03-19", orders: 1, balance: 150, status: "inactive" },
  { id: "5502918823", name: "Bethel M.", username: "bethelm", joined: "2026-04-07", orders: 9, balance: 320, status: "active" },
  { id: "6104477291", name: "Yared A.", username: "yaredab", joined: "2026-05-22", orders: 0, balance: 0, status: "inactive" },
  { id: "5967120044", name: "Hana D.", username: "hanad_22", joined: "2026-06-11", orders: 6, balance: 210, status: "active" },
];

const ORDERS = [
  { id: 4821, user: "@abelt", service: "gemini", amount: "300 ETB", status: "pending", created: "Jul 26" },
  { id: 4820, user: "@selamg", service: "telegram_stars", amount: "120 ETB", status: "approved", created: "Jul 26" },
  { id: 4819, user: "@bethelm", service: "telegram_premium", amount: "980 ETB", status: "completed", created: "Jul 25" },
  { id: 4818, user: "@hanad_22", service: "usdt_sell", amount: "2,340 ETB", status: "rejected", created: "Jul 25" },
  { id: 4817, user: "@abelt", service: "gemini", amount: "300 ETB", status: "completed", created: "Jul 24" },
];

const TOP_REFERRERS = [
  { rank: 1, name: "@abelt", invites: 34 },
  { rank: 2, name: "@bethelm", invites: 29 },
  { rank: 3, name: "@hanad_22", invites: 21 },
  { rank: 4, name: "Nahom K.", invites: 14 },
  { rank: 5, name: "@selamg", invites: 9 },
];

/* -------------------------------------------------------------------------
   SMALL UI PRIMITIVES
--------------------------------------------------------------------------*/

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function ServiceTag({ service }) {
  const meta = SERVICE_META[service];
  if (!meta) return <span className="text-sm text-slate-500">{service}</span>;
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
      <Icon className="h-4 w-4" style={{ color: meta.color }} />
      {meta.label}
    </span>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {checked ? (
        <ToggleRight className="h-8 w-8 shrink-0 text-blue-600" />
      ) : (
        <ToggleLeft className="h-8 w-8 shrink-0 text-slate-300" />
      )}
    </button>
  );
}

function Card({ className = "", children }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">{eyebrow}</p>}
        <h2 className="mt-0.5 text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------
   PAGE SECTIONS
--------------------------------------------------------------------------*/

function Overview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <span
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    card.up ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {card.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {card.delta}
                </span>
              </div>
              <p className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">{card.value}</p>
              <p className="text-sm text-slate-500">{card.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <SectionHeading eyebrow="This week" title="Message & Order Activity" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MESSAGE_ACTIVITY} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="msgFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }}
                  labelStyle={{ fontWeight: 600, color: "#0F172A" }}
                />
                <Area type="monotone" dataKey="messages" stroke="#2563EB" strokeWidth={2.5} fill="url(#msgFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeading eyebrow="Split" title="Orders by Service" />
          <div className="flex h-64 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SERVICE_SPLIT}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {SERVICE_SPLIT.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {SERVICE_SPLIT.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="font-semibold text-slate-800">{s.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionHeading
          eyebrow="Live"
          title="Recent Orders"
          action={
            <button className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
              View all <ChevronRight className="h-4 w-4" />
            </button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                <th className="pb-3 font-semibold">Order</th>
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Service</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 text-sm last:border-0">
                  <td className="py-3 font-medium text-slate-800">#{o.id}</td>
                  <td className="py-3 text-slate-600">{o.user}</td>
                  <td className="py-3">
                    <ServiceTag service={o.service} />
                  </td>
                  <td className="py-3 text-slate-600">{o.amount}</td>
                  <td className="py-3">
                    <StatusPill status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ActiveUsers() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      USERS.filter((u) =>
        `${u.name} ${u.username || ""} ${u.id}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  return (
    <Card className="p-5">
      <SectionHeading
        eyebrow={`${USERS.length} users`}
        title="Active Users"
        action={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, username, ID"
              className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none ring-blue-200 focus:bg-white focus:ring-2"
            />
          </div>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
              <th className="pb-3 font-semibold">User</th>
              <th className="pb-3 font-semibold">User ID</th>
              <th className="pb-3 font-semibold">Joined</th>
              <th className="pb-3 font-semibold">Orders</th>
              <th className="pb-3 font-semibold">Balance</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 text-sm last:border-0">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.username ? `@${u.username}` : "no username"}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 font-mono text-xs text-slate-500">{u.id}</td>
                <td className="py-3 text-slate-600">{u.joined}</td>
                <td className="py-3 text-slate-600">{u.orders}</td>
                <td className="py-3 text-slate-600">{u.balance} ETB</td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                      u.status === "active"
                        ? "bg-blue-50 text-blue-600 ring-blue-200"
                        : "bg-slate-100 text-slate-500 ring-slate-200"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${u.status === "active" ? "bg-blue-600" : "bg-slate-400"}`} />
                    {u.status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-slate-400">
                  No users match "{query}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function OrdersPanel() {
  const counts = ["pending", "approved", "completed", "rejected"].map((s) => ({
    status: s,
    count: ORDERS.filter((o) => o.status === s).length,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {counts.map((c) => {
          const meta = STATUS_META[c.status];
          const Icon = meta.icon;
          return (
            <Card key={c.status} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.className.split(" ")[1]}`}>
                  <Icon className={`h-4.5 w-4.5 ${meta.className.split(" ")[0]}`} />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{c.count}</p>
                  <p className="text-xs text-slate-500">{meta.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <SectionHeading eyebrow="All orders" title="Order Management" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                <th className="pb-3 font-semibold">Order</th>
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Service</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 text-sm last:border-0">
                  <td className="py-3 font-medium text-slate-800">#{o.id}</td>
                  <td className="py-3 text-slate-600">{o.user}</td>
                  <td className="py-3">
                    <ServiceTag service={o.service} />
                  </td>
                  <td className="py-3 text-slate-600">{o.amount}</td>
                  <td className="py-3 text-slate-500">{o.created}</td>
                  <td className="py-3">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="py-3 text-right">
                    {o.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                          Approve
                        </button>
                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ReferralsPanel() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-2">
        <SectionHeading eyebrow="Program" title="Top Referrers" />
        <div className="space-y-2">
          {TOP_REFERRERS.map((r) => (
            <div
              key={r.rank}
              className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    r.rank === 1
                      ? "bg-blue-600 text-white"
                      : r.rank <= 3
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {r.rank}
                </span>
                <p className="font-semibold text-slate-800">{r.name}</p>
              </div>
              <p className="text-sm font-semibold text-slate-600">{r.invites} invites</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeading eyebrow="Config" title="Referral Settings" />
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Invites needed per reward
            </label>
            <input
              type="text"
              defaultValue="10"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Referral discount %
            </label>
            <input
              type="text"
              defaultValue="10"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Reward note shown to users
            </label>
            <textarea
              rows={3}
              defaultValue="Contact admin for your reward!"
              className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <button className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Save Changes
          </button>
        </div>
      </Card>
    </div>
  );
}

function AnalyticsPanel() {
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <SectionHeading eyebrow="7-day trend" title="Message Volume" />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MESSAGE_ACTIVITY} margin={{ left: -20, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="msgFill2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }} />
              <Area type="monotone" dataKey="messages" stroke="#2563EB" strokeWidth={2.5} fill="url(#msgFill2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeading eyebrow="7-day trend" title="Orders Placed" />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MESSAGE_ACTIVITY} margin={{ left: -20, right: 10, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }} />
              <Bar dataKey="orders" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function BotSettingsPanel() {
  const [settings, setSettings] = useState({
    newUserNotifications: true,
    autoReply: true,
    maintenanceMode: false,
    analyticsEnabled: true,
  });

  const update = (key) => (val) => setSettings((s) => ({ ...s, [key]: val }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="p-5">
        <SectionHeading eyebrow="Admin Panel" title="Bot Controls" />
        <div className="space-y-3">
          <Toggle
            checked={settings.newUserNotifications}
            onChange={update("newUserNotifications")}
            label="New user notifications"
            description="Alert admin when someone new starts the bot"
          />
          <Toggle
            checked={settings.autoReply}
            onChange={update("autoReply")}
            label="Auto reply"
            description="Automatically acknowledge support messages"
          />
          <Toggle
            checked={settings.maintenanceMode}
            onChange={update("maintenanceMode")}
            label="Maintenance mode"
            description="Pauses new orders and shows a maintenance notice"
          />
          <Toggle
            checked={settings.analyticsEnabled}
            onChange={update("analyticsEnabled")}
            label="Analytics"
            description="Track usage to power the dashboard charts"
          />
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeading eyebrow="Access" title="Admin & Channels" />
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Admin ID</p>
              <p className="font-mono text-xs text-slate-500">5522724001</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Required channels
            </label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 ring-1 ring-inset ring-blue-200">
                @Novapluset
              </span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bot username</label>
            <input
              type="text"
              defaultValue="NovaPlus_TopupBot"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <button className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Save Bot Settings
          </button>
        </div>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------
   SHELL: SIDEBAR + TOP BAR
--------------------------------------------------------------------------*/

export default function AdminDashboard() {
  const [active, setActive] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeLabel = NAV_ITEMS.find((n) => n.key === active)?.label || "Overview";

  const renderSection = () => {
    switch (active) {
      case "overview":
        return <Overview />;
      case "users":
        return <ActiveUsers />;
      case "orders":
        return <OrdersPanel />;
      case "referrals":
        return <ReferralsPanel />;
      case "analytics":
        return <AnalyticsPanel />;
      case "settings":
        return <BotSettingsPanel />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-full min-h-[640px] w-full bg-slate-50 text-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-30 flex h-full w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-extrabold text-white">
              N+
            </div>
            <div>
              <p className="text-sm font-extrabold leading-none text-slate-900">NovaPlus</p>
              <p className="text-xs text-slate-400">Admin Console</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setActive(item.key);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                    : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              A
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">Admin</p>
              <p className="truncate font-mono text-xs text-slate-400">ID 5522724001</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-slate-500" />
            </button>
            <div>
              <p className="text-xs text-slate-400">Dashboard / {activeLabel}</p>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{activeLabel}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Quick search..."
                className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                3
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{renderSection()}</main>
      </div>
    </div>
  );
}