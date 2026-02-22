import { useState } from 'react'
import {
  Settings as SettingsIcon,
  Mail,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Save,
  TestTube,
} from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/services/api'

export default function Settings() {
  const [imapConfig, setImapConfig] = useState({
    host: '',
    port: '993',
    user: '',
    pass: '',
    tls: true,
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [syncInterval, setSyncInterval] = useState('5')
  const [autoAnalyze, setAutoAnalyze] = useState(true)

  async function handleTestConnection() {
    setTesting(true)
    setTestResult(null)
    try {
      await api.testImap(imapConfig)
      setTestResult('success')
    } catch {
      setTestResult('error')
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    // Settings are now managed via .env file
    // This is a placeholder for future settings storage in Supabase
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Configurações</h1>
        <p className="text-text-muted text-sm mt-0.5">Configurações do sistema de suporte</p>
      </div>

      {/* IMAP Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-accent" />
            <h3 className="text-text-primary font-semibold">Conexão IMAP</h3>
          </div>
          <p className="text-text-muted text-xs mt-1">Configurações carregadas do arquivo .env</p>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-xs font-medium mb-1.5">Servidor IMAP</label>
              <input
                type="text"
                value={imapConfig.host}
                onChange={(e) => setImapConfig({ ...imapConfig, host: e.target.value })}
                placeholder="dagobah.servidor.seg.br"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-text-secondary text-xs font-medium mb-1.5">Porta</label>
              <input
                type="text"
                value={imapConfig.port}
                onChange={(e) => setImapConfig({ ...imapConfig, port: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-text-secondary text-xs font-medium mb-1.5">Usuário</label>
              <input
                type="text"
                value={imapConfig.user}
                onChange={(e) => setImapConfig({ ...imapConfig, user: e.target.value })}
                placeholder="suporte@mooze.app"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-text-secondary text-xs font-medium mb-1.5">Senha</label>
              <input
                type="password"
                value={imapConfig.pass}
                onChange={(e) => setImapConfig({ ...imapConfig, pass: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={imapConfig.tls}
                onChange={(e) => setImapConfig({ ...imapConfig, tls: e.target.checked })}
                className="w-4 h-4 rounded accent-accent"
              />
              <span className="text-text-secondary text-sm">Usar TLS/SSL</span>
            </label>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2 bg-surface-hover text-text-primary rounded-lg text-sm font-medium hover:bg-border transition-colors disabled:opacity-50"
            >
              <TestTube size={14} />
              {testing ? 'Testando...' : 'Testar Conexão'}
            </button>
            {testResult === 'success' && (
              <span className="flex items-center gap-1.5 text-success text-sm">
                <CheckCircle2 size={14} />
                Conexão OK
              </span>
            )}
            {testResult === 'error' && (
              <span className="flex items-center gap-1.5 text-danger text-sm">
                <AlertTriangle size={14} />
                Falha na conexão
              </span>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw size={18} className="text-accent" />
            <h3 className="text-text-primary font-semibold">Sincronização</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <label className="block text-text-secondary text-xs font-medium mb-1.5">
                Intervalo de sincronização (minutos)
              </label>
              <select
                value={syncInterval}
                onChange={(e) => setSyncInterval(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="1">1 minuto</option>
                <option value="5">5 minutos</option>
                <option value="10">10 minutos</option>
                <option value="30">30 minutos</option>
                <option value="60">1 hora</option>
                <option value="0">Manual</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAnalyze}
                onChange={(e) => setAutoAnalyze(e.target.checked)}
                className="w-4 h-4 rounded accent-accent"
              />
              <span className="text-text-secondary text-sm">Analisar automaticamente novos e-mails</span>
            </label>
          </div>
        </CardBody>
      </Card>

      {/* Database */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database size={18} className="text-accent" />
            <h3 className="text-text-primary font-semibold">Banco de Dados</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-background rounded-lg p-3 text-center">
              <p className="text-text-primary text-lg font-bold">Supabase</p>
              <p className="text-text-muted text-xs">Engine</p>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <p className="text-text-primary text-lg font-bold">Cloud</p>
              <p className="text-text-muted text-xs">Localização</p>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <p className="text-text-primary text-lg font-bold">PostgreSQL</p>
              <p className="text-text-muted text-xs">Database</p>
            </div>
          </div>
          <p className="text-text-muted text-xs mt-3">
            Dados armazenados em Supabase PostgreSQL com acesso remoto para toda a equipe
          </p>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover"
        >
          <Save size={16} />
          Salvar Configurações
        </button>
      </div>
    </div>
  )
}
