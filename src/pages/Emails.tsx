import { useEffect, useState } from 'react'
import {
  Search,
  Filter,
  RefreshCw,
  Mail,
  Brain,
  Send,
  Copy,
  Edit3,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge, UrgencyBadge, CategoryBadge, RiskBadge } from '@/components/ui/Badge'
import { useEmailStore } from '@/store/emailStore'
import { api } from '@/services/api'
import { cn, timeAgo, formatDate } from '@/lib/utils'
import { CATEGORY_LABELS, URGENCY_LABELS } from '@/types'
import type { Email, EmailCategory, UrgencyLevel, EmailStatus } from '@/types'

export default function Emails() {
  const {
    emails, selectedEmail, filters, syncing, loading,
    setEmails, selectEmail, updateEmail, setFilters, setSyncing, setLoading, getFilteredEmails,
  } = useEmailStore()

  const [showFilters, setShowFilters] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [editingResponse, setEditingResponse] = useState(false)
  const [responseSource, setResponseSource] = useState<'learned' | 'template' | null>(null)

  useEffect(() => { loadEmails() }, [])

  async function loadEmails() {
    setLoading(true)
    try {
      const res = await api.fetchEmails({ limit: 100 })
      setEmails(res.emails)
    } catch { /* Backend offline */ } finally { setLoading(false) }
  }

  async function handleSync() {
    setSyncing(true)
    try { await api.syncEmails(); await loadEmails() }
    catch { /* err */ } finally { setSyncing(false) }
  }

  async function handleAnalyze(email: Email) {
    setAnalyzing(true)
    try {
      const a = await api.analyzeEmail(email.id)
      updateEmail(email.id, {
        category: a.category, urgency: a.urgency, risk: a.risk,
        suggestedResponse: a.suggestedResponse, internalAction: a.internalAction,
        isRecurrent: a.isRecurrent, recurrentPattern: a.recurrentPattern, status: 'em_analise',
      })
      setResponseText(a.suggestedResponse)
      setResponseSource(a.responseSource || 'template')
    } catch { /* err */ } finally { setAnalyzing(false) }
  }

  async function handleSendResponse() {
    if (!selectedEmail || !responseText.trim()) return
    try {
      await api.sendResponse(selectedEmail.id, responseText)
      updateEmail(selectedEmail.id, { status: 'respondido', respondedAt: new Date().toISOString() })
      setResponseText('')
      setEditingResponse(false)
    } catch { /* err */ }
  }

  const filtered = getFilteredEmails()

  return (
    <div className="flex gap-4 h-[calc(100vh-48px)]">
      {/* ── Left: Email List ── */}
      <div className="w-[300px] flex flex-col shrink-0">
        {/* Search */}
        <div className="mb-3">
          <div className="flex gap-1.5">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-[7px] text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={cn('px-2.5 rounded-lg border', showFilters ? 'bg-accent-dim border-accent/30 text-accent' : 'bg-surface border-border text-text-muted hover:text-text-secondary')}>
              <Filter size={14} />
            </button>
            <button onClick={handleSync} disabled={syncing}
              className="px-2.5 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50">
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            </button>
          </div>
          {showFilters && (
            <div className="mt-2 bg-surface border border-border rounded-lg p-2 grid grid-cols-3 gap-1.5">
              <select value={filters.category} onChange={(e) => setFilters({ category: e.target.value as EmailCategory | 'all' })}
                className="bg-background border border-border rounded px-1.5 py-1 text-[11px] text-text-primary focus:outline-none focus:border-accent">
                <option value="all">Categoria</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={filters.urgency} onChange={(e) => setFilters({ urgency: e.target.value as UrgencyLevel | 'all' })}
                className="bg-background border border-border rounded px-1.5 py-1 text-[11px] text-text-primary focus:outline-none focus:border-accent">
                <option value="all">Urgência</option>
                {Object.entries(URGENCY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={filters.status} onChange={(e) => setFilters({ status: e.target.value as EmailStatus | 'all' })}
                className="bg-background border border-border rounded px-1.5 py-1 text-[11px] text-text-primary focus:outline-none focus:border-accent">
                <option value="all">Status</option>
                <option value="novo">Novo</option>
                <option value="em_analise">Em Análise</option>
                <option value="respondido">Respondido</option>
                <option value="resolvido">Resolvido</option>
              </select>
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw size={18} className="mx-auto text-accent animate-spin mb-2" />
              <p className="text-text-muted text-[13px]">Carregando...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((email) => (
              <div
                key={email.id}
                onClick={() => { selectEmail(email); setResponseText(email.suggestedResponse || ''); setEditingResponse(false); setResponseSource(null) }}
                className={cn(
                  'px-3 py-2.5 rounded-lg border cursor-pointer transition-all',
                  selectedEmail?.id === email.id
                    ? 'bg-accent-subtle border-accent/25 shadow-xs'
                    : 'bg-surface border-transparent hover:border-border hover:bg-surface-hover',
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {!email.read && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                    <p className="text-text-primary text-[13px] font-medium truncate">{email.fromName || email.from}</p>
                  </div>
                  <span className="text-text-muted text-[10px] whitespace-nowrap">{timeAgo(email.date)}</span>
                </div>
                <p className="text-text-secondary text-[12px] truncate">{email.subject}</p>
                {(email.urgency || email.category) && (
                  <div className="flex items-center gap-1 mt-1.5">
                    {email.urgency && <UrgencyBadge level={email.urgency} />}
                    {email.category && <CategoryBadge category={email.category} />}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-16 text-center">
              <Mail size={24} className="mx-auto text-text-muted mb-2" />
              <p className="text-text-muted text-[13px]">Nenhum e-mail</p>
            </div>
          )}
        </div>

        <p className="text-text-muted text-[10px] text-center py-2 border-t border-border">
          {filtered.length} e-mail(s) &middot; {emails.filter(e => !e.read).length} não lidos
        </p>
      </div>

      {/* ── Right: Detail (single scrollable panel) ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {selectedEmail ? (
          <div className="space-y-4">
            {/* Header bar */}
            <div className="bg-surface border border-border rounded-xl shadow-xs p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-text-primary text-[15px] font-semibold leading-snug">{selectedEmail.subject}</h2>
                  <p className="text-text-muted text-[13px] mt-1">
                    <span className="text-text-primary font-medium">{selectedEmail.fromName || selectedEmail.from}</span>
                    {' '}&middot;{' '}
                    {formatDate(selectedEmail.date)}
                  </p>
                  {(selectedEmail.urgency || selectedEmail.category) && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      {selectedEmail.urgency && <UrgencyBadge level={selectedEmail.urgency} />}
                      {selectedEmail.category && <CategoryBadge category={selectedEmail.category} />}
                      {selectedEmail.risk && selectedEmail.risk !== 'nenhum' && <RiskBadge risk={selectedEmail.risk} />}
                      {selectedEmail.isRecurrent && <Badge variant="warning" dot>Recorrente</Badge>}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleAnalyze(selectedEmail)}
                  disabled={analyzing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-[13px] font-medium hover:bg-accent-hover disabled:opacity-50 shrink-0 shadow-xs"
                >
                  <Brain size={14} className={analyzing ? 'animate-pulse' : ''} />
                  {analyzing ? 'Analisando...' : 'Analisar'}
                </button>
              </div>
            </div>

            {/* Email body */}
            <div className="bg-surface border border-border rounded-xl shadow-xs p-5">
              <div className="text-text-secondary text-[13px] leading-relaxed whitespace-pre-wrap">
                {selectedEmail.body}
              </div>
            </div>

            {/* Internal Action (if exists) */}
            {selectedEmail.internalAction && (
              <div className="bg-warning-dim border border-warning/20 rounded-xl px-5 py-3">
                <p className="text-warning-text text-[11px] font-semibold mb-0.5">Ação Interna Sugerida</p>
                <p className="text-text-secondary text-[13px]">{selectedEmail.internalAction}</p>
              </div>
            )}

            {/* Response section */}
            <div className="bg-surface border border-border rounded-xl shadow-xs">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-text-primary font-medium text-[13px]">Resposta</h3>
                  {responseSource === 'learned' && responseText && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success-dim text-success-text text-[10px] font-medium rounded-full">
                      <Sparkles size={10} />
                      Baseada em respostas reais
                    </span>
                  )}
                  {responseSource === 'template' && responseText && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-info-dim text-info-text text-[10px] font-medium rounded-full">
                      Template padrão
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {responseText && (
                    <>
                      <button onClick={() => navigator.clipboard.writeText(responseText)}
                        className="p-1.5 text-text-muted hover:text-text-secondary rounded hover:bg-surface-hover">
                        <Copy size={13} />
                      </button>
                      <button onClick={() => setEditingResponse(!editingResponse)}
                        className={cn('p-1.5 rounded', editingResponse ? 'text-accent bg-accent-dim' : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover')}>
                        <Edit3 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-5">
                {editingResponse || !responseText ? (
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Clique em 'Analisar' para gerar uma resposta ou escreva manualmente..."
                    rows={4}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                  />
                ) : (
                  <div className="bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                    {responseText}
                  </div>
                )}
                <div className="flex justify-between items-center mt-3">
                  <button
                    onClick={() => updateEmail(selectedEmail.id, { status: 'resolvido' })}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-success-text bg-success-dim border border-success/20 rounded-lg text-[12px] font-medium hover:bg-success/10"
                  >
                    <CheckCircle2 size={12} />
                    Resolvido
                  </button>
                  <button
                    onClick={handleSendResponse}
                    disabled={!responseText.trim()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-white rounded-lg text-[13px] font-medium hover:bg-accent-hover shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={13} />
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center mx-auto mb-3">
                <Mail size={22} className="text-text-muted" />
              </div>
              <p className="text-text-primary text-[14px] font-medium">Selecione um e-mail</p>
              <p className="text-text-muted text-[12px] mt-0.5">Clique na lista para ver o conteúdo</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
