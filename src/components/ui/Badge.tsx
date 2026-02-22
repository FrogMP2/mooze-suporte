import { cn } from '@/lib/utils'
import type { UrgencyLevel, EmailCategory, RiskType } from '@/types'
import { URGENCY_LABELS, CATEGORY_LABELS, RISK_LABELS } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'critical'
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

const variantStyles: Record<string, string> = {
  default: 'text-text-secondary bg-surface-hover border-border',
  accent: 'text-accent bg-accent-dim border-accent/20',
  success: 'text-success-text bg-success-dim border-success/20',
  warning: 'text-warning-text bg-warning-dim border-warning/20',
  danger: 'text-danger-text bg-danger-dim border-danger/20',
  info: 'text-info-text bg-info-dim border-info/20',
  critical: 'text-critical-text bg-critical-dim border-critical/20',
}

const dotColors: Record<string, string> = {
  default: 'bg-text-muted',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  critical: 'bg-critical',
}

export function Badge({ children, variant = 'default', size = 'sm', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md whitespace-nowrap border',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5',
        variantStyles[variant],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  )
}

const urgencyVariants: Record<UrgencyLevel, BadgeProps['variant']> = {
  baixa: 'success',
  media: 'info',
  alta: 'warning',
  critica: 'critical',
}

export function UrgencyBadge({ level }: { level: UrgencyLevel }) {
  return <Badge variant={urgencyVariants[level]} dot>{URGENCY_LABELS[level]}</Badge>
}

export function CategoryBadge({ category }: { category: EmailCategory }) {
  return <Badge variant="accent">{CATEGORY_LABELS[category]}</Badge>
}

const riskVariants: Record<RiskType, BadgeProps['variant']> = {
  tecnico: 'warning',
  reputacional: 'danger',
  juridico: 'critical',
  nenhum: 'default',
}

export function RiskBadge({ risk }: { risk: RiskType }) {
  return <Badge variant={riskVariants[risk]} dot>{RISK_LABELS[risk]}</Badge>
}
