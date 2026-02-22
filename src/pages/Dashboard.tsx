import { useEffect, useState } from 'react'
import {
  Mail,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Zap,
  BarChart3,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { UrgencyBadge } from '@/components/ui/Badge'
import { useEmailStore } from '@/store/emailStore'
import { api } from '@/services/api'
import { timeAgo } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/types'
import type { Email } from '@/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#dc2626']

const tooltipStyle = {
  contentStyle: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)',
  },
}

export default function Dashboard() {
  const { emails, stats, patterns, syncing, setSyncing, setEmails, setStats, setPatterns } = useEmailStore()
  const [recentEmails, setRecentEmails] = useState<Email[]>([])

  useEffect(() => { loadDashboard() }, [])

  useEffect(() => {
    const sorted = [...emails].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setRecentEmails(sorted.slice(0, 6))
  }, [emails])

  async function loadDashboard() {
    try {
      const [emailsRes, statsRes, patternsRes] = await Promise.all([
        api.fetchEmails({ limit: 50 }).catch(() => ({ emails: [], total: 0 })),
        api.getStats().catch(() => null),
        api.getPatterns().catch(() => []),
      ])
      setEmails(emailsRes.emails)
      if (statsRes) setStats(statsRes)
      setPatterns(patternsRes)
    } catch { /* Backend offline */ }
  }

  async function handleSync() {
    setSyncing(true)
    try { await api.syncEmails(); await loadDashboard() }
    catch { /* err */ } finally { setSyncing(false) }
  }

  const urgencyData = stats.urgencyDistribution.length > 0
    ? stats.urgencyDistribution.map((d) => ({ name: d.level, value: d.count }))
    : [{ name: 'Baixa', value: 0 }, { name: 'Média', value: 0 }, { name: 'Alta', value: 0 }, { name: 'Crítica', value: 0 }]

  const categoryData = stats.topCategories.length > 0
    ? stats.topCategories.slice(0, 5).map((d) => ({ name: CATEGORY_LABELS[d.category], count: d.count }))
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
          <p className="text-text-muted text-sm mt-0.5">Visão geral do suporte Mooze</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total de E-mails" value={stats.totalEmails || emails.length || 0} icon={Mail} variant="accent" />
        <StatCard title="Aguardando Resposta" value={stats.pendingResponse || 0} icon={Clock} variant="warning" subtitle="em aberto" />
        <StatCard title="Críticos" value={stats.critical || 0} icon={AlertTriangle} variant="danger" subtitle="atenção imediata" />
        <StatCard title="Resolvidos Hoje" value={stats.resolvedToday || 0} icon={CheckCircle2} variant="success" />
      </div>

      {/* Secondary KPIs - compact row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: Mail, iconBg: 'bg-info-dim', iconColor: 'text-info', value: stats.unread || 0, label: 'Não lidos' },
          { icon: Zap, iconBg: 'bg-accent-dim', iconColor: 'text-accent', value: stats.avgResponseTime || '--', label: 'Tempo médio' },
          { icon: ShieldAlert, iconBg: 'bg-danger-dim', iconColor: 'text-danger', value: stats.riskAlerts || 0, label: 'Alertas de risco' },
          { icon: TrendingUp, iconBg: 'bg-warning-dim', iconColor: 'text-warning', value: stats.recurrentIssues || 0, label: 'Recorrentes' },
        ].map((item, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4 shadow-xs flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
              <item.icon size={15} className={item.iconColor} />
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary leading-none">{item.value}</p>
              <p className="text-text-muted text-[11px] mt-0.5">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-3">
          <CardHeader className="py-3 px-5">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-text-muted" />
              <h3 className="text-text-primary font-medium text-[13px]">Distribuição por Categoria</h3>
            </div>
          </CardHeader>
          <CardBody className="py-3 px-5">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                  <XAxis type="number" stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={10} width={130} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" fill="#f7931a" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-text-muted text-sm">
                Sincronize os e-mails para ver dados
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="py-3 px-5">
            <h3 className="text-text-primary font-medium text-[13px]">Urgência</h3>
          </CardHeader>
          <CardBody className="py-3 px-5">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={urgencyData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {urgencyData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">
              {urgencyData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-text-secondary text-[11px]">{item.name}</span>
                  <span className="text-text-primary text-[11px] font-medium ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader className="py-3 px-5">
            <div className="flex items-center justify-between">
              <h3 className="text-text-primary font-medium text-[13px]">E-mails Recentes</h3>
              <a href="/emails" className="inline-flex items-center gap-1 text-accent text-[11px] font-medium hover:text-accent-hover">
                Ver todos <ArrowRight size={11} />
              </a>
            </div>
          </CardHeader>
          <div>
            {recentEmails.length > 0 ? (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[10px] font-medium text-text-muted uppercase tracking-wider px-5 py-2">Remetente</th>
                    <th className="text-left text-[10px] font-medium text-text-muted uppercase tracking-wider px-3 py-2">Assunto</th>
                    <th className="text-left text-[10px] font-medium text-text-muted uppercase tracking-wider px-3 py-2">Urgência</th>
                    <th className="text-right text-[10px] font-medium text-text-muted uppercase tracking-wider px-5 py-2">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEmails.map((email) => (
                    <tr key={email.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="px-5 py-2.5"><p className="text-text-primary text-[13px] font-medium truncate max-w-[150px]">{email.fromName || email.from}</p></td>
                      <td className="px-3 py-2.5"><p className="text-text-secondary text-[13px] truncate max-w-[250px]">{email.subject}</p></td>
                      <td className="px-3 py-2.5">{email.urgency && <UrgencyBadge level={email.urgency} />}</td>
                      <td className="px-5 py-2.5 text-right"><span className="text-text-muted text-[11px]">{timeAgo(email.date)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-10 text-center">
                <Mail size={24} className="mx-auto text-text-muted mb-2" />
                <p className="text-text-muted text-sm">Nenhum e-mail sincronizado</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader className="py-3 px-5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-warning" />
              <h3 className="text-text-primary font-medium text-[13px]">Alertas Ativos</h3>
            </div>
          </CardHeader>
          <div>
            {patterns.length > 0 ? (
              <div className="divide-y divide-border">
                {patterns.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="px-5 py-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        alert.severity === 'critical' ? 'bg-critical' : alert.severity === 'warning' ? 'bg-warning' : 'bg-info'
                      }`} />
                      <p className="text-text-primary text-[13px] font-medium">{alert.pattern}</p>
                    </div>
                    <p className="text-text-muted text-[11px] ml-4">{alert.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <CheckCircle2 size={24} className="mx-auto text-success mb-2" />
                <p className="text-text-muted text-sm">Nenhum alerta</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
