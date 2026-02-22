import { useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  ShieldAlert,
  TrendingUp,
  X,
} from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface Alert {
  id: string
  type: 'pattern' | 'risk' | 'spike' | 'security'
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  count: number
  timestamp: string
  acknowledged: boolean
}

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'spike',
    severity: 'critical',
    title: 'Aumento súbito: Erro de Transação',
    description: 'Detectados 12 e-mails sobre erro de transação nas últimas 3 horas. Possível incidente operacional.',
    count: 12,
    timestamp: '2026-02-22T10:30:00',
    acknowledged: false,
  },
  {
    id: '2',
    type: 'risk',
    severity: 'critical',
    title: 'Risco Jurídico Detectado',
    description: 'Usuário mencionou Procon e processo judicial em e-mail sobre fundos travados. Requer atenção imediata.',
    count: 1,
    timestamp: '2026-02-22T09:15:00',
    acknowledged: false,
  },
  {
    id: '3',
    type: 'pattern',
    severity: 'warning',
    title: 'Padrão recorrente: Sincronização de Saldo',
    description: '8 relatos de problema de sincronização após atualização v2.4.1. Possível bug introduzido.',
    count: 8,
    timestamp: '2026-02-22T08:00:00',
    acknowledged: false,
  },
  {
    id: '4',
    type: 'security',
    severity: 'warning',
    title: 'Tentativa de phishing detectada',
    description: 'E-mail contém link suspeito solicitando seed phrase. Marcado como tentativa de phishing.',
    count: 1,
    timestamp: '2026-02-21T16:45:00',
    acknowledged: true,
  },
  {
    id: '5',
    type: 'pattern',
    severity: 'info',
    title: 'Tendência: Dúvidas sobre Liquid Network',
    description: 'Aumento gradual de perguntas sobre Liquid nos últimos 7 dias. Considerar material educativo.',
    count: 15,
    timestamp: '2026-02-21T14:00:00',
    acknowledged: true,
  },
]

const severityConfig = {
  critical: { color: 'text-critical', bg: 'bg-critical-dim', icon: ShieldAlert, label: 'Crítico' },
  warning: { color: 'text-warning', bg: 'bg-warning-dim', icon: AlertTriangle, label: 'Aviso' },
  info: { color: 'text-info', bg: 'bg-info-dim', icon: Bell, label: 'Info' },
}

const typeLabels = {
  pattern: 'Padrão',
  risk: 'Risco',
  spike: 'Pico',
  security: 'Segurança',
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS)
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('all')

  const filtered = alerts.filter((a) => {
    if (filter === 'active') return !a.acknowledged
    if (filter === 'acknowledged') return a.acknowledged
    return true
  })

  const activeCount = alerts.filter((a) => !a.acknowledged).length
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length

  function handleAcknowledge(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Alertas</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {activeCount} alerta(s) ativo(s) • {criticalCount} crítico(s)
          </p>
        </div>
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          {(['all', 'active', 'acknowledged'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                filter === f
                  ? 'bg-accent text-background'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Reconhecidos'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((alert) => {
          const config = severityConfig[alert.severity]
          const Icon = config.icon
          return (
            <Card
              key={alert.id}
              className={cn(
                'transition-all',
                !alert.acknowledged && alert.severity === 'critical' && 'border-critical/40',
                !alert.acknowledged && alert.severity === 'warning' && 'border-warning/30',
                alert.acknowledged && 'opacity-60'
              )}
            >
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', config.bg)}>
                    <Icon size={20} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-text-primary font-semibold text-sm">{alert.title}</h3>
                      <Badge variant={alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info'}>
                        {config.label}
                      </Badge>
                      <Badge variant="default">{typeLabels[alert.type]}</Badge>
                    </div>
                    <p className="text-text-secondary text-sm">{alert.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-text-muted text-xs flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(alert.timestamp).toLocaleString('pt-BR')}
                      </span>
                      {alert.count > 1 && (
                        <span className="text-text-muted text-xs flex items-center gap-1">
                          <TrendingUp size={12} />
                          {alert.count} ocorrências
                        </span>
                      )}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-success bg-success-dim rounded-lg text-xs font-medium hover:bg-success/20 shrink-0"
                    >
                      <CheckCircle2 size={13} />
                      Reconhecer
                    </button>
                  )}
                </div>
              </CardBody>
            </Card>
          )
        })}

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <CheckCircle2 size={48} className="mx-auto text-success mb-4" />
            <p className="text-text-secondary text-lg">Nenhum alerta encontrado</p>
            <p className="text-text-muted text-sm mt-1">
              {filter === 'active' ? 'Todos os alertas foram reconhecidos' : 'Nenhum alerta registrado'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
