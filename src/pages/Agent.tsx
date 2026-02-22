import { useState } from 'react'
import {
  Brain,
  Send,
  Sparkles,
  Shield,
  AlertTriangle,
  BookOpen,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  History,
} from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface AgentMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
  analysis?: {
    category: string
    urgency: string
    risk: string
    isRecurrent: boolean
  }
}

const QUICK_ACTIONS = [
  { label: 'Analisar Inbox Completo', icon: Brain, action: 'analyze_all' },
  { label: 'Detectar Padrões', icon: Sparkles, action: 'detect_patterns' },
  { label: 'Relatório de Riscos', icon: AlertTriangle, action: 'risk_report' },
  { label: 'Gerar FAQ', icon: BookOpen, action: 'generate_faq' },
  { label: 'Auditoria de Segurança', icon: Shield, action: 'security_audit' },
  { label: 'Resumo do Dia', icon: History, action: 'daily_summary' },
]

export default function Agent() {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: '1',
      role: 'agent',
      content: `Olá! Sou o Agente de Inteligência de Suporte da Mooze.

Posso ajudar com:
• **Análise de e-mails** — Classifico por categoria, urgência e risco
• **Detecção de padrões** — Identifico problemas recorrentes
• **Geração de respostas** — Sugiro respostas seguras e profissionais
• **Inteligência estratégica** — Gero insights para melhorar o suporte

Todas as análises são feitas localmente. Nenhum dado sai da máquina.

Como posso ajudar?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState(false)

  async function handleSend() {
    if (!input.trim() || processing) return

    const userMsg: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setProcessing(true)

    // Simulate agent response (will connect to real backend)
    setTimeout(() => {
      const agentMsg: AgentMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `Processando sua solicitação...

Para funcionar completamente, o backend precisa estar rodando. Inicie com:
\`\`\`
cd server && npm start
\`\`\`

O agente irá:
1. Conectar ao servidor IMAP (dagobah.servidor.seg.br)
2. Baixar e classificar os e-mails
3. Gerar análises e sugestões de resposta

Tudo processado localmente na sua máquina.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, agentMsg])
      setProcessing(false)
    }, 1500)
  }

  async function handleQuickAction(action: string) {
    const actionLabels: Record<string, string> = {
      analyze_all: 'Analisar todos os e-mails do inbox',
      detect_patterns: 'Detectar padrões e problemas recorrentes',
      risk_report: 'Gerar relatório de riscos ativos',
      generate_faq: 'Gerar FAQ baseado nas dúvidas mais frequentes',
      security_audit: 'Verificar alertas de segurança nos e-mails',
      daily_summary: 'Gerar resumo operacional do dia',
    }

    setInput(actionLabels[action] || action)
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-48px)]">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-text-primary">Agente IA</h1>
          <p className="text-text-muted text-sm mt-0.5">Sistema nervoso do suporte Mooze</p>
        </div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-xl px-4 py-3',
                    msg.role === 'user'
                      ? 'bg-accent text-background'
                      : 'bg-surface-hover text-text-primary'
                  )}
                >
                  {msg.role === 'agent' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={14} className="text-accent" />
                      <span className="text-accent text-xs font-medium">Agente Mooze</span>
                    </div>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                      part.startsWith('**') && part.endsWith('**') ? (
                        <strong key={i}>{part.slice(2, -2)}</strong>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </div>
                  {msg.analysis && (
                    <div className="mt-3 pt-3 border-t border-border flex gap-2 flex-wrap">
                      <Badge variant="accent">{msg.analysis.category}</Badge>
                      <Badge variant="warning">{msg.analysis.urgency}</Badge>
                      {msg.analysis.isRecurrent && <Badge variant="danger">Recorrente</Badge>}
                    </div>
                  )}
                  {msg.role === 'agent' && (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
                      <button className="p-1 text-text-muted hover:text-success" title="Útil">
                        <ThumbsUp size={12} />
                      </button>
                      <button className="p-1 text-text-muted hover:text-danger" title="Não útil">
                        <ThumbsDown size={12} />
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="p-1 text-text-muted hover:text-text-primary"
                        title="Copiar"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {processing && (
              <div className="flex justify-start">
                <div className="bg-surface-hover rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={14} className="text-accent animate-spin" />
                    <span className="text-text-secondary text-sm">Processando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte ao agente ou solicite uma análise..."
                className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || processing}
                className="px-4 py-2.5 bg-accent text-background rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions Sidebar */}
      <div className="w-72 space-y-4 shrink-0">
        <Card>
          <CardHeader>
            <h3 className="text-text-primary font-semibold text-sm">Ações Rápidas</h3>
          </CardHeader>
          <CardBody className="p-3 space-y-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.action}
                onClick={() => handleQuickAction(action.action)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-left"
              >
                <action.icon size={16} className="text-accent shrink-0" />
                {action.label}
              </button>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-text-primary font-semibold text-sm">Regras de Segurança</h3>
          </CardHeader>
          <CardBody className="space-y-2">
            <div className="flex items-start gap-2">
              <Shield size={14} className="text-danger shrink-0 mt-0.5" />
              <p className="text-text-muted text-xs">Nunca solicitar seed phrase ou chave privada</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield size={14} className="text-danger shrink-0 mt-0.5" />
              <p className="text-text-muted text-xs">Nunca prometer reversão de transação</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield size={14} className="text-danger shrink-0 mt-0.5" />
              <p className="text-text-muted text-xs">Nunca sugerir custódia de fundos</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield size={14} className="text-warning shrink-0 mt-0.5" />
              <p className="text-text-muted text-xs">Priorizar educação sobre autocustódia</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield size={14} className="text-success shrink-0 mt-0.5" />
              <p className="text-text-muted text-xs">Dados processados 100% localmente</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
