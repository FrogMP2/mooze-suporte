import { HashRouter, Routes, Route } from 'react-router-dom'
import AuthGuard from '@/components/auth/AuthGuard'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Emails from '@/pages/Emails'
import Agent from '@/pages/Agent'
import Alerts from '@/pages/Alerts'
import Analytics from '@/pages/Analytics'
import Templates from '@/pages/Templates'
import Security from '@/pages/Security'
import Settings from '@/pages/Settings'
import Financeiro from '@/pages/Financeiro'

export default function App() {
  return (
    <HashRouter>
      <AuthGuard>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/emails" element={<Emails />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/security" element={<Security />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthGuard>
    </HashRouter>
  )
}
