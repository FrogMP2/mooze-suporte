import { supabase } from '@/lib/supabase'
import type { Email, EmailAnalysis, DashboardStats, PatternAlert, ResponseTemplate, ChatMessage } from '@/types'

const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001'

export const api = {
  // ─── EMAILS ─────────────────────────────────────────────────

  fetchEmails: async (params?: { folder?: string; limit?: number; offset?: number }) => {
    const limit = params?.limit || 100
    const offset = params?.offset || 0

    const { data, count, error } = await supabase
      .from('emails')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)
    return { emails: (data || []) as Email[], total: count || 0 }
  },

  syncEmails: async () => {
    const res = await fetch(`${SYNC_SERVER_URL}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || 'Erro ao sincronizar e-mails')
    }
    return res.json() as Promise<{ synced: number; total: number }>
  },

  getEmail: async (id: string) => {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data as Email
  },

  updateEmail: async (id: string, updates: Partial<Email>) => {
    const { data, error } = await supabase
      .from('emails')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Email
  },

  // ─── ANALYSIS (Gemini AI via server) ────────────────────────

  analyzeEmail: async (id: string) => {
    const res = await fetch(`${SYNC_SERVER_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId: id }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || 'Erro na análise AI')
    }
    return res.json() as Promise<EmailAnalysis>
  },

  analyzeAll: async () => {
    const res = await fetch(`${SYNC_SERVER_URL}/api/analyze-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || 'Erro na análise em massa')
    }
    return res.json() as Promise<{ analyzed: number; total?: number }>
  },

  // ─── STATS ──────────────────────────────────────────────────

  getStats: async () => {
    const { data, error } = await supabase.rpc('get_dashboard_stats')
    if (error) throw new Error(error.message)
    return data as DashboardStats
  },

  // ─── PATTERNS ─────────────────────────────────────────────

  getPatterns: async () => {
    const { data, error } = await supabase.rpc('get_patterns')
    if (error) throw new Error(error.message)
    return (data || []) as PatternAlert[]
  },

  // ─── TEMPLATES ────────────────────────────────────────────

  getTemplates: async () => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('usageCount', { ascending: false })

    if (error) throw new Error(error.message)
    return (data || []) as ResponseTemplate[]
  },

  createTemplate: async (templateData: Partial<ResponseTemplate>) => {
    const { data, error } = await supabase
      .from('templates')
      .insert(templateData)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as ResponseTemplate
  },

  updateTemplate: async (id: string, updates: Partial<ResponseTemplate>) => {
    const { data, error } = await supabase
      .from('templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as ResponseTemplate
  },

  deleteTemplate: async (id: string) => {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  // ─── CHAT MESSAGES ──────────────────────────────────────────

  fetchChatMessages: async (limit = 50) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('createdAt', { ascending: true })
      .limit(limit)

    if (error) throw new Error(error.message)
    return (data || []) as ChatMessage[]
  },

  saveChatMessage: async (msg: { role: 'user' | 'agent'; content: string; action?: string }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ ...msg, userId: user.id })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as ChatMessage
  },

  clearChatHistory: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('userId', user.id)

    if (error) throw new Error(error.message)
  },

  // ─── SEND NEW EMAIL ────────────────────────────────────────

  sendNewEmail: async (params: { to: string; subject: string; body: string }) => {
    const res = await fetch(`${SYNC_SERVER_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || 'Erro ao enviar email')
    }
    return res.json() as Promise<{ success: boolean }>
  },

  // ─── BULK SEND ──────────────────────────────────────────────

  bulkSend: async (params: { recipients: { email: string; name: string }[]; subject: string; body: string }) => {
    const res = await fetch(`${SYNC_SERVER_URL}/api/bulk-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || 'Erro no envio em massa')
    }
    return res.json() as Promise<{ sent: number; failed: number; errors: { email: string; error: string }[] }>
  },

  // ─── RESPOND ──────────────────────────────────────────────

  sendResponse: async (emailId: string, content: string) => {
    const res = await fetch(`${SYNC_SERVER_URL}/api/send-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId, content }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || 'Erro ao enviar resposta')
    }
    return res.json() as Promise<{ success: boolean }>
  },

  // ─── KNOWLEDGE BASE ──────────────────────────────────────

  getKnowledge: async () => {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('updatedAt', { ascending: false })

    if (error) throw new Error(error.message)
    return (data || []) as { id: string; category: string; title: string; content: string; source: string; createdAt: string; updatedAt: string }[]
  },

  addKnowledge: async (entry: { category: string; title: string; content: string; source?: string }) => {
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert(entry)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  updateKnowledge: async (id: string, updates: { category?: string; title?: string; content?: string }) => {
    const { data, error } = await supabase
      .from('knowledge_base')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  deleteKnowledge: async (id: string) => {
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  // ─── SETTINGS ─────────────────────────────────────────────

  testImap: async (config: Record<string, unknown>) => {
    const res = await fetch(`${SYNC_SERVER_URL}/api/test-imap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || 'Erro ao testar conexão IMAP')
    }
    return res.json()
  },
}
