import { useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  Lightbulb,
  FileQuestion,
  Users,
  ArrowUpRight,
  Calendar,
} from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'

const weeklyTrend = [
  { day: 'Seg', emails: 12, resolved: 10 },
  { day: 'Ter', emails: 15, resolved: 12 },
  { day: 'Qua', emails: 8, resolved: 9 },
  { day: 'Qui', emails: 22, resolved: 18 },
  { day: 'Sex', emails: 18, resolved: 15 },
  { day: 'Sáb', emails: 5, resolved: 5 },
  { day: 'Dom', emails: 3, resolved: 3 },
]

const topIssues = [
  { issue: 'Como fazer backup da carteira?', count: 34, trend: '+12%' },
  { issue: 'Transação pendente há muito tempo', count: 28, trend: '+5%' },
  { issue: 'Como usar Liquid Network?', count: 22, trend: '+18%' },
  { issue: 'Taxa de transação muito alta', count: 18, trend: '-3%' },
  { issue: 'App não sincroniza saldo', count: 15, trend: '+8%' },
  { issue: 'Como receber Bitcoin?', count: 12, trend: '-5%' },
  { issue: 'Erro ao enviar transação', count: 10, trend: '+2%' },
  { issue: 'Perdi meu backup', count: 8, trend: '0%' },
]

const uxSuggestions = [
  {
    area: 'Onboarding',
    suggestion: 'Adicionar tutorial interativo sobre backup de seed phrase',
    impact: 'alta',
    basedOn: '34 tickets sobre backup',
  },
  {
    area: 'Transações',
    suggestion: 'Melhorar feedback visual de transação pendente com estimativa de tempo',
    impact: 'alta',
    basedOn: '28 tickets sobre pendências',
  },
  {
    area: 'Liquid Network',
    suggestion: 'Criar seção educacional sobre Liquid dentro do app',
    impact: 'media',
    basedOn: '22 tickets sobre Liquid',
  },
  {
    area: 'Taxas',
    suggestion: 'Adicionar seletor de prioridade com estimativa de taxa antes de confirmar',
    impact: 'alta',
    basedOn: '18 tickets sobre taxas',
  },
  {
    area: 'Sincronização',
    suggestion: 'Implementar indicador de status de conexão com nó',
    impact: 'media',
    basedOn: '15 tickets de sincronização',
  },
]

const faqSuggestions = [
  { q: 'Como faço backup da minha carteira Mooze?', category: 'Segurança', priority: 1 },
  { q: 'Minha transação está pendente. O que fazer?', category: 'Transações', priority: 2 },
  { q: 'O que é a Liquid Network e como usar?', category: 'Educacional', priority: 3 },
  { q: 'Por que a taxa de transação está alta?', category: 'Taxas', priority: 4 },
  { q: 'O saldo não aparece corretamente', category: 'Técnico', priority: 5 },
  { q: 'Como receber Bitcoin na Mooze?', category: 'Educacional', priority: 6 },
  { q: 'Perdi minha seed phrase. E agora?', category: 'Segurança', priority: 7 },
  { q: 'A Mooze tem acesso aos meus fundos?', category: 'Educacional', priority: 8 },
]

const tooltipStyle = {
  contentStyle: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)',
  },
}

export default function Analytics() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Inteligência Estratégica</h1>
          <p className="text-text-muted text-sm mt-0.5">Insights gerados a partir da base de suporte</p>
        </div>
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-accent text-background'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* Volume Trend */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-accent" />
            <h3 className="text-text-primary font-semibold">Volume de E-mails vs Resolvidos</h3>
          </div>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={weeklyTrend}>
              <defs>
                <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f7931a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f7931a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#d1d5db" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="emails" stroke="#f7931a" fill="url(#colorEmails)" strokeWidth={2} name="Recebidos" />
              <Area type="monotone" dataKey="resolved" stroke="#22c55e" fill="url(#colorResolved)" strokeWidth={2} name="Resolvidos" />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Issues */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileQuestion size={18} className="text-accent" />
              <h3 className="text-text-primary font-semibold">Dúvidas Mais Recorrentes</h3>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-border">
              {topIssues.map((issue, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-4">
                  <span className="text-text-muted text-sm font-mono w-6 text-right">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm truncate">{issue.issue}</p>
                  </div>
                  <span className="text-text-secondary text-sm font-medium">{issue.count}x</span>
                  <span
                    className={`text-xs font-medium ${
                      issue.trend.startsWith('+') ? 'text-danger' : issue.trend.startsWith('-') ? 'text-success' : 'text-text-muted'
                    }`}
                  >
                    {issue.trend}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* FAQ Suggestions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb size={18} className="text-warning" />
              <h3 className="text-text-primary font-semibold">FAQ Sugerida</h3>
            </div>
            <p className="text-text-muted text-xs mt-1">Baseado na análise dos tickets de suporte</p>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-border">
              {faqSuggestions.map((faq, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <span className="text-accent text-sm font-bold mt-0.5">Q{faq.priority}</span>
                    <div className="flex-1">
                      <p className="text-text-primary text-sm">{faq.q}</p>
                      <Badge variant="default" className="mt-1">{faq.category}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* UX Improvement Suggestions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-info" />
            <h3 className="text-text-primary font-semibold">Sugestões de Melhoria de UX</h3>
          </div>
          <p className="text-text-muted text-xs mt-1">Pontos de fricção identificados nos tickets</p>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-border">
            {uxSuggestions.map((s, i) => (
              <div key={i} className="px-5 py-4 flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-info-dim flex items-center justify-center shrink-0">
                  <ArrowUpRight size={16} className="text-info" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="info">{s.area}</Badge>
                    <Badge variant={s.impact === 'alta' ? 'danger' : 'warning'}>
                      Impacto {s.impact}
                    </Badge>
                  </div>
                  <p className="text-text-primary text-sm">{s.suggestion}</p>
                  <p className="text-text-muted text-xs mt-1">Baseado em: {s.basedOn}</p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
