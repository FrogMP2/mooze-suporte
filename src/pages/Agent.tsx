import { useState, useRef, useEffect } from 'react'
import {
  Brain,
  Send,
  Sparkles,
  Shield,
  AlertTriangle,
  BookOpen,
  RefreshCw,
  Copy,
  History,
  Check,
  Trash2,
  Mail,
  Users,
  X,
} from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import type { ChatMessage } from '@/types'

const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001'

interface BulkSendData {
  action: 'bulk_send'
  subject: string
  body: string
  recipients: { email: string; name: string }[]
  reason: string
}

interface AgentAction {
  type: 'reply_email' | 'move_email' | 'delete_email' | 'bulk_send'
  emailId?: string
  subject?: string
  body?: string
  folder?: string
  recipients?: { email: string; name: string }[]
}

interface MultiActionData {
  action: 'multi_action'
  summary: string
  actions: AgentAction[]
  reason: string
}

const ACTION_LABELS: Record<string, string> = {
  reply_email: 'Responder email',
  move_email: 'Mover email',
  delete_email: 'Apagar email',
  bulk_send: 'Disparar emails',
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  userId: '',
  role: 'agent',
  content: `Olá! Sou o Agente de Inteligência de Suporte da Mooze, alimentado por IA.

Posso ajudar com:
• **Análise inteligente de e-mails** — Classifico e sugiro respostas personalizadas
• **Detecção de padrões** — Identifico problemas recorrentes nos dados reais
• **Relatórios e insights** — Gero análises de risco, resumos e FAQs
• **Chat livre** — Pergunte qualquer coisa sobre os dados de suporte

Use as **Ações Rápidas** ao lado ou digite sua pergunta abaixo.`,
  createdAt: new Date().toISOString(),
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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pendingBulkSend, setPendingBulkSend] = useState<BulkSendData | null>(null)
  const [sendingBulk, setSendingBulk] = useState(false)
  const [pendingMultiAction, setPendingMultiAction] = useState<MultiActionData | null>(null)
  const [executingMulti, setExecutingMulti] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await api.fetchChatMessages(50)
        setMessages(history)
      } catch {
        // Table may not exist yet, ignore
      } finally {
        setLoadingHistory(false)
      }
    }
    loadHistory()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, processing])

  async function sendToAgent(message: string, action?: string) {
    if (processing) return
    setInput('')
    setProcessing(true)

    try {
      // Save user message to DB
      let userMsg: ChatMessage
      try {
        userMsg = await api.saveChatMessage({ role: 'user', content: message, action })
      } catch {
        userMsg = { id: Date.now().toString(), userId: '', role: 'user', content: message, createdAt: new Date().toISOString() }
      }
      setMessages((prev) => [...prev, userMsg])

      // Call agent API
      const res = await fetch(`${SYNC_SERVER_URL}/api/agent-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, action }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(err.message || 'Erro ao comunicar com o agente')
      }

      const data = await res.json()

      // Parse JSON actions from agent response
      let bulkSendData: BulkSendData | null = null
      let multiActionData: MultiActionData | null = null
      try {
        let jsonStr = data.response.trim()
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim()
        const parsed = JSON.parse(jsonStr)
        if (parsed.action === 'bulk_send' && parsed.recipients?.length) {
          bulkSendData = parsed
        } else if (parsed.action === 'multi_action' && parsed.actions?.length) {
          multiActionData = parsed
        }
      } catch {
        // Not JSON, normal text response
      }

      if (multiActionData) {
        const summary = `Pronto para executar **${multiActionData.actions.length}** ação(ões):\n\n**${multiActionData.summary}**\n\n**Motivo:** ${multiActionData.reason}\n\nRevise e confirme abaixo.`
        let agentMsg: ChatMessage
        try { agentMsg = await api.saveChatMessage({ role: 'agent', content: summary }) }
        catch { agentMsg = { id: (Date.now() + 1).toString(), userId: '', role: 'agent', content: summary, createdAt: new Date().toISOString() } }
        setMessages((prev) => [...prev, agentMsg])
        setPendingMultiAction(multiActionData)
      } else if (bulkSendData) {
        const summary = `Encontrei **${bulkSendData.recipients.length}** destinatário(s) para o envio.\n\n**Motivo:** ${bulkSendData.reason}\n\nRevise os detalhes abaixo e confirme o envio.`
        let agentMsg: ChatMessage
        try {
          agentMsg = await api.saveChatMessage({ role: 'agent', content: summary })
        } catch {
          agentMsg = { id: (Date.now() + 1).toString(), userId: '', role: 'agent', content: summary, createdAt: new Date().toISOString() }
        }
        setMessages((prev) => [...prev, agentMsg])
        setPendingBulkSend(bulkSendData)
      } else {
        // Save agent response to DB
        let agentMsg: ChatMessage
        try {
          agentMsg = await api.saveChatMessage({ role: 'agent', content: data.response })
        } catch {
          agentMsg = { id: (Date.now() + 1).toString(), userId: '', role: 'agent', content: data.response, createdAt: new Date().toISOString() }
        }
        setMessages((prev) => [...prev, agentMsg])
      }
    } catch (error) {
      const errorContent = `Erro ao processar: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique se o sync worker está rodando.`
      let errMsg: ChatMessage
      try {
        errMsg = await api.saveChatMessage({ role: 'agent', content: errorContent })
      } catch {
        errMsg = { id: (Date.now() + 1).toString(), userId: '', role: 'agent', content: errorContent, createdAt: new Date().toISOString() }
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setProcessing(false)
    }
  }

  function handleSend() {
    if (!input.trim() || processing) return
    sendToAgent(input.trim())
  }

  function handleQuickAction(action: string) {
    const actionLabels: Record<string, string> = {
      analyze_all: 'Analisar todos os e-mails do inbox',
      detect_patterns: 'Detectar padrões e problemas recorrentes',
      risk_report: 'Gerar relatório de riscos ativos',
      generate_faq: 'Gerar FAQ baseado nas dúvidas mais frequentes',
      security_audit: 'Verificar alertas de segurança nos e-mails',
      daily_summary: 'Gerar resumo operacional do dia',
    }
    sendToAgent(actionLabels[action] || action, action)
  }

  async function handleClearHistory() {
    try {
      await api.clearChatHistory()
      setMessages([])
    } catch {
      // ignore
    }
  }

  async function handleConfirmBulkSend() {
    if (!pendingBulkSend || sendingBulk) return
    setSendingBulk(true)

    try {
      const result = await api.bulkSend({
        recipients: pendingBulkSend.recipients,
        subject: pendingBulkSend.subject,
        body: pendingBulkSend.body,
      })

      const resultContent = result.failed === 0
        ? `Envio concluído! **${result.sent}** email(s) enviado(s) com sucesso.`
        : `Envio concluído: **${result.sent}** enviado(s), **${result.failed}** falha(s).\n${result.errors.map((e) => `• ${e.email}: ${e.error}`).join('\n')}`

      let resultMsg: ChatMessage
      try {
        resultMsg = await api.saveChatMessage({ role: 'agent', content: resultContent })
      } catch {
        resultMsg = { id: (Date.now() + 2).toString(), userId: '', role: 'agent', content: resultContent, createdAt: new Date().toISOString() }
      }
      setMessages((prev) => [...prev, resultMsg])
    } catch (error) {
      const errorContent = `Erro no envio em massa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      let errMsg: ChatMessage
      try {
        errMsg = await api.saveChatMessage({ role: 'agent', content: errorContent })
      } catch {
        errMsg = { id: (Date.now() + 2).toString(), userId: '', role: 'agent', content: errorContent, createdAt: new Date().toISOString() }
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setPendingBulkSend(null)
      setSendingBulk(false)
    }
  }

  async function handleConfirmMultiAction() {
    if (!pendingMultiAction || executingMulti) return
    setExecutingMulti(true)
    try {
      const result = await api.multiAction(pendingMultiAction.actions)
      const resultContent = `Ações executadas: **${result.succeeded}/${result.total}** com sucesso.\n${result.results.map(r => `• ${ACTION_LABELS[r.type] || r.type}${r.emailId ? ` (${r.emailId.slice(0, 8)}...)` : ''}: ${r.success ? '✓' : '✗ ' + (r.error || 'falhou')}`).join('\n')}`
      let resultMsg: ChatMessage
      try { resultMsg = await api.saveChatMessage({ role: 'agent', content: resultContent }) }
      catch { resultMsg = { id: (Date.now() + 2).toString(), userId: '', role: 'agent', content: resultContent, createdAt: new Date().toISOString() } }
      setMessages((prev) => [...prev, resultMsg])
    } catch (error) {
      const errContent = `Erro ao executar ações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      let errMsg: ChatMessage
      try { errMsg = await api.saveChatMessage({ role: 'agent', content: errContent }) }
      catch { errMsg = { id: (Date.now() + 2).toString(), userId: '', role: 'agent', content: errContent, createdAt: new Date().toISOString() } }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setPendingMultiAction(null)
      setExecutingMulti(false)
    }
  }

  async function handleCancelMultiAction() {
    const cancelContent = 'Ações canceladas pelo operador.'
    let cancelMsg: ChatMessage
    try { cancelMsg = await api.saveChatMessage({ role: 'agent', content: cancelContent }) }
    catch { cancelMsg = { id: (Date.now() + 2).toString(), userId: '', role: 'agent', content: cancelContent, createdAt: new Date().toISOString() } }
    setMessages((prev) => [...prev, cancelMsg])
    setPendingMultiAction(null)
  }

  async function handleCancelBulkSend() {
    const cancelContent = 'Envio cancelado pelo operador.'
    let cancelMsg: ChatMessage
    try {
      cancelMsg = await api.saveChatMessage({ role: 'agent', content: cancelContent })
    } catch {
      cancelMsg = { id: (Date.now() + 2).toString(), userId: '', role: 'agent', content: cancelContent, createdAt: new Date().toISOString() }
    }
    setMessages((prev) => [...prev, cancelMsg])
    setPendingBulkSend(null)
  }

  function handleCopy(id: string, content: string) {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function renderContent(content: string) {
    return content.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={j}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={j}>{part}</span>
        )
      )
      return (
        <span key={i}>
          {parts}
          {i < content.split('\n').length - 1 && <br />}
        </span>
      )
    })
  }

  const displayMessages = messages.length === 0 && !loadingHistory ? [WELCOME_MESSAGE] : messages

  return (
    <div className="flex gap-6 h-[calc(100vh-48px)]">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-text-primary">Agente IA</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Inteligência artificial para suporte — powered by Gemini
          </p>
        </div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <RefreshCw size={18} className="text-accent animate-spin" />
              </div>
            ) : (
              displayMessages.map((msg) => (
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
                      {renderContent(msg.content)}
                    </div>
                    {msg.role === 'agent' && msg.id !== 'welcome' && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="p-1 text-text-muted hover:text-text-primary flex items-center gap-1"
                          title="Copiar"
                        >
                          {copiedId === msg.id ? (
                            <><Check size={12} className="text-success" /><span className="text-xs text-success">Copiado</span></>
                          ) : (
                            <><Copy size={12} /><span className="text-xs">Copiar</span></>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {processing && (
              <div className="flex justify-start">
                <div className="bg-surface-hover rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={14} className="text-accent animate-spin" />
                    <span className="text-text-secondary text-sm">Analisando dados e gerando resposta...</span>
                  </div>
                </div>
              </div>
            )}
            {pendingMultiAction && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl border border-accent/30 bg-surface-hover overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-accent/10 border-b border-accent/20">
                    <Brain size={14} className="text-accent" />
                    <span className="text-accent text-sm font-medium">Confirmar Ações do Agente ({pendingMultiAction.actions.length})</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-text-primary text-sm font-medium">{pendingMultiAction.summary}</p>
                    <div className="space-y-1.5">
                      {pendingMultiAction.actions.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-text-secondary bg-background rounded px-2 py-1.5">
                          <span className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            a.type === 'delete_email' ? 'bg-red-400' :
                            a.type === 'reply_email' ? 'bg-emerald-400' :
                            a.type === 'move_email' ? 'bg-blue-400' : 'bg-amber-400'
                          )} />
                          <span className="font-medium">{ACTION_LABELS[a.type]}</span>
                          {a.emailId && <span className="text-text-muted">ID: {a.emailId.slice(0, 8)}...</span>}
                          {a.folder && <span className="text-text-muted">→ {a.folder}</span>}
                          {a.recipients && <span className="text-text-muted">{a.recipients.length} dest.</span>}
                        </div>
                      ))}
                    </div>
                    <p className="text-text-muted text-xs italic">{pendingMultiAction.reason}</p>
                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      <button
                        onClick={handleConfirmMultiAction}
                        disabled={executingMulti}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover disabled:opacity-50"
                      >
                        {executingMulti ? <><RefreshCw size={14} className="animate-spin" /> Executando...</> : <><Send size={14} /> Executar tudo</>}
                      </button>
                      <button onClick={handleCancelMultiAction} disabled={executingMulti} className="px-3 py-2 border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-50">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {pendingBulkSend && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl border border-accent/30 bg-surface-hover overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-accent/10 border-b border-accent/20">
                    <Mail size={14} className="text-accent" />
                    <span className="text-accent text-sm font-medium">Confirmar Envio em Massa</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Users size={13} className="text-text-muted" />
                        <span className="text-text-secondary text-xs font-medium">
                          Destinatários ({pendingBulkSend.recipients.length})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {pendingBulkSend.recipients.map((r, i) => (
                          <div key={i} className="text-xs text-text-primary bg-background rounded px-2 py-1">
                            {r.name ? `${r.name} — ${r.email}` : r.email}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-text-secondary text-xs font-medium">Assunto</span>
                      <p className="text-sm text-text-primary mt-0.5">{pendingBulkSend.subject}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary text-xs font-medium">Corpo do Email</span>
                      <pre className="text-xs text-text-primary mt-0.5 whitespace-pre-wrap bg-background rounded p-2 max-h-40 overflow-y-auto">
                        {pendingBulkSend.body}
                      </pre>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      <button
                        onClick={handleConfirmBulkSend}
                        disabled={sendingBulk}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover disabled:opacity-50"
                      >
                        {sendingBulk ? (
                          <><RefreshCw size={14} className="animate-spin" /> Enviando...</>
                        ) : (
                          <><Send size={14} /> Confirmar Envio</>
                        )}
                      </button>
                      <button
                        onClick={handleCancelBulkSend}
                        disabled={sendingBulk}
                        className="px-3 py-2 border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-50"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte ao agente sobre os emails de suporte..."
                className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                disabled={processing}
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
                disabled={processing}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-left disabled:opacity-50"
              >
                <action.icon size={16} className="text-accent shrink-0" />
                {action.label}
              </button>
            ))}
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-danger hover:bg-surface-hover transition-colors text-left mt-2 pt-2 border-t border-border"
              >
                <Trash2 size={16} className="shrink-0" />
                Limpar Histórico
              </button>
            )}
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
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
