export type EmailCategory =
  | 'problema_tecnico'
  | 'duvida_educacional'
  | 'erro_transacao'
  | 'confusao_taxas'
  | 'problema_sincronizacao'
  | 'questao_liquid'
  | 'suspeita_bug'
  | 'reclamacao'
  | 'sugestao_melhoria'
  | 'seguranca'
  | 'perda_acesso'
  | 'outro'

export type UrgencyLevel = 'baixa' | 'media' | 'alta' | 'critica'

export type RiskType = 'tecnico' | 'reputacional' | 'juridico' | 'nenhum'

export type EmailStatus = 'novo' | 'em_analise' | 'respondido' | 'resolvido' | 'arquivado'

export interface Email {
  id: string
  messageId: string
  from: string
  fromName: string
  to: string
  subject: string
  body: string
  bodyHtml?: string
  date: string
  folder: string
  read: boolean
  status: EmailStatus
  category?: EmailCategory
  urgency?: UrgencyLevel
  risk?: RiskType
  suggestedResponse?: string
  internalAction?: string
  isRecurrent?: boolean
  recurrentPattern?: string
  operatorNotes?: string
  respondedAt?: string
  respondedBy?: string
  tags?: string[]
  attachments?: Attachment[]
}

export interface Attachment {
  filename: string
  contentType: string
  size: number
}

export interface EmailAnalysis {
  emailId: string
  category: EmailCategory
  urgency: UrgencyLevel
  risk: RiskType
  summary: string
  suggestedResponse: string
  responseSource: 'learned' | 'template'
  internalAction: string
  isRecurrent: boolean
  recurrentPattern?: string
  confidence: number
  keywords: string[]
}

export interface ResponseTemplate {
  id: string
  name: string
  category: EmailCategory
  content: string
  usageCount: number
  approvalRate: number
  lastUsed?: string
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalEmails: number
  unread: number
  critical: number
  pendingResponse: number
  resolvedToday: number
  avgResponseTime: string
  topCategories: { category: EmailCategory; count: number }[]
  urgencyDistribution: { level: UrgencyLevel; count: number }[]
  riskAlerts: number
  recurrentIssues: number
}

export interface PatternAlert {
  id: string
  pattern: string
  category: EmailCategory
  count: number
  firstSeen: string
  lastSeen: string
  severity: 'info' | 'warning' | 'critical'
  description: string
}

export const CATEGORY_LABELS: Record<EmailCategory, string> = {
  problema_tecnico: 'Problema Técnico',
  duvida_educacional: 'Dúvida Educacional',
  erro_transacao: 'Erro de Transação',
  confusao_taxas: 'Confusão sobre Taxas',
  problema_sincronizacao: 'Problema de Sincronização',
  questao_liquid: 'Questão sobre Liquid',
  suspeita_bug: 'Suspeita de Bug',
  reclamacao: 'Reclamação',
  sugestao_melhoria: 'Sugestão de Melhoria',
  seguranca: 'Segurança',
  perda_acesso: 'Perda de Acesso',
  outro: 'Outro',
}

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
}

export const RISK_LABELS: Record<RiskType, string> = {
  tecnico: 'Risco Técnico',
  reputacional: 'Risco Reputacional',
  juridico: 'Risco Jurídico',
  nenhum: 'Sem Risco',
}

export const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  baixa: 'text-success bg-success-dim',
  media: 'text-info bg-info-dim',
  alta: 'text-warning bg-warning-dim',
  critica: 'text-critical bg-critical-dim',
}

export const CATEGORY_ICONS: Record<EmailCategory, string> = {
  problema_tecnico: 'Wrench',
  duvida_educacional: 'GraduationCap',
  erro_transacao: 'AlertTriangle',
  confusao_taxas: 'DollarSign',
  problema_sincronizacao: 'RefreshCw',
  questao_liquid: 'Droplets',
  suspeita_bug: 'Bug',
  reclamacao: 'MessageSquareWarning',
  sugestao_melhoria: 'Lightbulb',
  seguranca: 'Shield',
  perda_acesso: 'KeyRound',
  outro: 'HelpCircle',
}
