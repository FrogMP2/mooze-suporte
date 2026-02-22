import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Mail,
  Brain,
  BarChart3,
  FileText,
  Settings,
  AlertTriangle,
  Shield,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', section: 'start' },
  { to: '/emails', icon: Mail, label: 'E-mails' },
  { to: '/agent', icon: Brain, label: 'Agente IA' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alertas', section: 'start' },
  { to: '/analytics', icon: BarChart3, label: 'Inteligência' },
  { to: '/templates', icon: FileText, label: 'Templates', section: 'start' },
  { to: '/security', icon: Shield, label: 'Segurança' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
]

export default function Sidebar() {
  const [userEmail, setUserEmail] = useState('operador')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })
  }, [])

  const initials = userEmail.slice(0, 2).toUpperCase()

  return (
    <aside className="sticky top-0 h-screen w-[200px] shrink-0 bg-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">M</span>
        </div>
        <span className="text-white font-semibold text-[14px]">Mooze</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {navItems.map((item, i) => (
          <div key={item.to}>
            {item.section === 'start' && i > 0 && (
              <div className="my-3 mx-2 border-t border-sidebar-border" />
            )}
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors mb-0.5',
                  isActive
                    ? 'bg-accent/15 text-accent font-medium'
                    : 'text-sidebar-text hover:text-white hover:bg-sidebar-hover'
                )
              }
            >
              <item.icon size={16} strokeWidth={1.7} />
              <span>{item.label}</span>
            </NavLink>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="h-12 flex items-center gap-2 px-4 border-t border-sidebar-border">
        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
          <span className="text-accent text-[9px] font-bold">{initials}</span>
        </div>
        <span className="text-sidebar-text text-[11px] truncate flex-1">{userEmail}</span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sidebar-text hover:text-white transition-colors shrink-0"
          title="Sair"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}
