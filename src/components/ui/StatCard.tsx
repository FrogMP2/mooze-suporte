import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
  variant?: 'default' | 'accent' | 'danger' | 'warning' | 'success'
}

const iconVariants: Record<string, string> = {
  default: 'bg-surface-hover text-text-muted',
  accent: 'bg-accent-dim text-accent',
  danger: 'bg-danger-dim text-danger',
  warning: 'bg-warning-dim text-warning',
  success: 'bg-success-dim text-success',
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <p className="text-text-secondary text-xs font-medium uppercase tracking-wide">{title}</p>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconVariants[variant])}>
          <Icon size={16} strokeWidth={2} />
        </div>
      </div>
      <p className="text-[28px] font-semibold text-text-primary leading-none tracking-tight">{value}</p>
      <div className="flex items-center gap-2 mt-2">
        {trend && (
          <span
            className={cn(
              'text-[11px] font-medium',
              trend.positive ? 'text-success' : 'text-danger'
            )}
          >
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
        )}
        {subtitle && <p className="text-text-muted text-[11px]">{subtitle}</p>}
      </div>
    </div>
  )
}
