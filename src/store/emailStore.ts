import { create } from 'zustand'
import type { Email, EmailAnalysis, DashboardStats, PatternAlert, ResponseTemplate, EmailCategory, UrgencyLevel, EmailStatus } from '@/types'

interface EmailFilters {
  search: string
  category: EmailCategory | 'all'
  urgency: UrgencyLevel | 'all'
  status: EmailStatus | 'all'
  folder: 'INBOX' | 'SENT'
  dateFrom?: string
  dateTo?: string
}

interface EmailStore {
  emails: Email[]
  selectedEmail: Email | null
  filters: EmailFilters
  stats: DashboardStats
  patterns: PatternAlert[]
  templates: ResponseTemplate[]
  loading: boolean
  syncing: boolean

  setEmails: (emails: Email[]) => void
  addEmails: (emails: Email[]) => void
  selectEmail: (email: Email | null) => void
  updateEmail: (id: string, updates: Partial<Email>) => void
  setFilters: (filters: Partial<EmailFilters>) => void
  setStats: (stats: DashboardStats) => void
  setPatterns: (patterns: PatternAlert[]) => void
  setTemplates: (templates: ResponseTemplate[]) => void
  setLoading: (loading: boolean) => void
  setSyncing: (syncing: boolean) => void
  getFilteredEmails: () => Email[]
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  emails: [],
  selectedEmail: null,
  filters: {
    search: '',
    category: 'all',
    urgency: 'all',
    status: 'all',
    folder: 'INBOX',
  },
  stats: {
    totalEmails: 0,
    unread: 0,
    critical: 0,
    pendingResponse: 0,
    resolvedToday: 0,
    avgResponseTime: '--',
    topCategories: [],
    urgencyDistribution: [],
    riskAlerts: 0,
    recurrentIssues: 0,
  },
  patterns: [],
  templates: [],
  loading: false,
  syncing: false,

  setEmails: (emails) => set({ emails }),
  addEmails: (newEmails) =>
    set((state) => {
      const existingIds = new Set(state.emails.map((e) => e.id))
      const unique = newEmails.filter((e) => !existingIds.has(e.id))
      return { emails: [...unique, ...state.emails] }
    }),
  selectEmail: (email) => set({ selectedEmail: email }),
  updateEmail: (id, updates) =>
    set((state) => ({
      emails: state.emails.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      selectedEmail:
        state.selectedEmail?.id === id
          ? { ...state.selectedEmail, ...updates }
          : state.selectedEmail,
    })),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setStats: (stats) => set({ stats }),
  setPatterns: (patterns) => set({ patterns }),
  setTemplates: (templates) => set({ templates }),
  setLoading: (loading) => set({ loading }),
  setSyncing: (syncing) => set({ syncing }),

  getFilteredEmails: () => {
    const { emails, filters } = get()
    return emails.filter((email) => {
      if (email.folder !== filters.folder) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const match =
          email.subject.toLowerCase().includes(q) ||
          (email.fromName || '').toLowerCase().includes(q) ||
          (email.from || '').toLowerCase().includes(q) ||
          (email.to || '').toLowerCase().includes(q) ||
          (email.body || '').toLowerCase().includes(q)
        if (!match) return false
      }
      if (filters.category !== 'all' && email.category !== filters.category) return false
      if (filters.urgency !== 'all' && email.urgency !== filters.urgency) return false
      if (filters.status !== 'all' && email.status !== filters.status) return false
      return true
    })
  },
}))
