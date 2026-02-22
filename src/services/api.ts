import { supabase } from '@/lib/supabase'
import { analyzeEmail as classifyEmail } from '@/lib/classifier'
import type { Email, EmailAnalysis, DashboardStats, PatternAlert, ResponseTemplate } from '@/types'

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

  // ─── ANALYSIS ───────────────────────────────────────────────

  analyzeEmail: async (id: string) => {
    const { data: email, error: fetchError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !email) throw new Error(fetchError?.message || 'E-mail não encontrado')

    const analysis = await classifyEmail(email as Email)

    const { error: updateError } = await supabase
      .from('emails')
      .update({
        category: analysis.category,
        urgency: analysis.urgency,
        risk: analysis.risk,
        suggestedResponse: analysis.suggestedResponse,
        internalAction: analysis.internalAction,
        isRecurrent: analysis.isRecurrent,
        recurrentPattern: analysis.recurrentPattern,
        status: 'em_analise',
      })
      .eq('id', id)

    if (updateError) throw new Error(updateError.message)
    return analysis as EmailAnalysis
  },

  analyzeAll: async () => {
    const { data: emails, error } = await supabase
      .from('emails')
      .select('*')
      .is('category', null)

    if (error) throw new Error(error.message)

    let analyzed = 0
    for (const email of emails || []) {
      try {
        const analysis = await classifyEmail(email as Email)
        await supabase
          .from('emails')
          .update({
            category: analysis.category,
            urgency: analysis.urgency,
            risk: analysis.risk,
            suggestedResponse: analysis.suggestedResponse,
            internalAction: analysis.internalAction,
            isRecurrent: analysis.isRecurrent,
            recurrentPattern: analysis.recurrentPattern,
            status: 'em_analise',
          })
          .eq('id', email.id)
        analyzed++
      } catch { /* skip individual failures */ }
    }

    return { analyzed }
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

  // ─── RESPOND ──────────────────────────────────────────────

  sendResponse: async (emailId: string, content: string) => {
    const { error: insertError } = await supabase
      .from('responses')
      .insert({ emailId, content })

    if (insertError) throw new Error(insertError.message)

    const { error: updateError } = await supabase
      .from('emails')
      .update({
        status: 'respondido',
        respondedAt: new Date().toISOString(),
        respondedBy: 'operador',
      })
      .eq('id', emailId)

    if (updateError) throw new Error(updateError.message)
    return { success: true }
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
