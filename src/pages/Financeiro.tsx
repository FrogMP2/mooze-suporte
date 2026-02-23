import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, Sun, Moon } from 'lucide-react'

// ── Mock data (substituir por queries reais quando DB liberar) ─────────────

const kpis = {
  volumeMensal:    { value: 1086139.25, sub: 'Desde o início do mês' },
  instalacoes:     { value: 5071 },
  taxasMes:        { value: 29385.20, sub: 'DEPIX + L-BTC no preço atual' },
  usuariosAtivos:  { value: 1061 },
  volumeTotal:     { value: 26444896.05, sub: 'Desde o lançamento do app' },
  percentVolume:   { value: 2.71 },
  volumeMedioD30:  { value: 51293.60, change: -25.73, sub: 'Comparado ao mês anterior' },
  mediaSatsD30:    { value: 167217, change: -13.3, sub: 'Em relação ao mês passado' },
  mediaTaxasD30:   { value: 1345.80, change: -20.33, sub: 'Sujeito à variação do BTC' },
  mediaDepixD30:   { value: 782.00, change: -24.74, sub: 'Em relação ao mês passado' },
}

const dailyData = [
  { dia: '23/02/2026', pixPagos: 23309.59, pixProcessado: 20809.59, transacoes: 62,  taxas: 563.05,  pct: 2.71, depix: 176.45 },
  { dia: '22/02/2026', pixPagos: 18259.24, pixProcessado: 18259.24, transacoes: 78,  taxas: 520.28,  pct: 2.85, depix: 276.43 },
  { dia: '21/02/2026', pixPagos: 31828.31, pixProcessado: 31828.31, transacoes: 107, taxas: 872.06,  pct: 2.74, depix: 485.48 },
  { dia: '20/02/2026', pixPagos: 13811.88, pixProcessado: 13811.88, transacoes: 100, taxas: 410.51,  pct: 2.97, depix: 257.28 },
  { dia: '19/02/2026', pixPagos: 39278.10, pixProcessado: 39278.10, transacoes: 125, taxas: 1086.57, pct: 2.77, depix: 830.06 },
  { dia: '18/02/2026', pixPagos: 37653.66, pixProcessado: 37653.66, transacoes: 128, taxas: 1052.54, pct: 2.80, depix: 668.89 },
  { dia: '17/02/2026', pixPagos: 29104.42, pixProcessado: 29104.42, transacoes: 95,  taxas: 814.92,  pct: 2.80, depix: 512.11 },
  { dia: '16/02/2026', pixPagos: 44215.77, pixProcessado: 44215.77, transacoes: 142, taxas: 1236.04, pct: 2.80, depix: 901.33 },
]

const chartVolumeDia = [
  { l: 'Mai', v: 45000 }, { l: 'Jun', v: 62000 }, { l: 'Jul', v: 89000 },
  { l: 'Ago', v: 120000 }, { l: 'Set', v: 210000 }, { l: 'Out', v: 248000 },
  { l: 'Nov', v: 195000 }, { l: 'Dez', v: 180000 }, { l: 'Jan', v: 165000 },
  { l: 'Fev', v: 51000 },
]
const chartUsuarios = [
  { l: 'Mai', v: 45 }, { l: 'Jun', v: 78 }, { l: 'Jul', v: 120 },
  { l: 'Ago', v: 165 }, { l: 'Set', v: 210 }, { l: 'Out', v: 248 },
  { l: 'Nov', v: 220 }, { l: 'Dez', v: 195 }, { l: 'Jan', v: 180 },
  { l: 'Fev', v: 85 },
]
const chartInstalacoes = [
  { l: 'Nov 28', v: 245 }, { l: 'Dez 5', v: 198 }, { l: 'Dez 12', v: 172 },
  { l: 'Dez 19', v: 145 }, { l: 'Dez 26', v: 118 }, { l: 'Jan 2', v: 95 },
  { l: 'Jan 9', v: 88 }, { l: 'Jan 16', v: 72 }, { l: 'Jan 23', v: 65 },
  { l: 'Jan 30', v: 58 }, { l: 'Fev 8', v: 42 },
]
const chartVolumeMensal = [
  { l: 'Mai/25', v: 1100000 }, { l: 'Jun/25', v: 1850000 }, { l: 'Jul/25', v: 2100000 },
  { l: 'Ago/25', v: 3800000 }, { l: 'Set/25', v: 3200000 }, { l: 'Out/25', v: 3950000 },
  { l: 'Nov/25', v: 3600000 }, { l: 'Dez/25', v: 2800000 }, { l: 'Jan/26', v: 2100000 },
  { l: 'Fev/26', v: 1086139 },
]

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (v: number, d = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })
const brl = (v: number) => 'R$\u00a0' + fmt(v)
const fmtK = (v: number) => v >= 1_000_000 ? 'R$' + fmt(v / 1_000_000, 1) + 'M' : v >= 1_000 ? 'R$' + fmt(v / 1_000, 0) + 'k' : 'R$' + fmt(v, 0)

// ── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, change }: { label: string; value: string; sub?: string; change?: number }) {
  const up = change !== undefined && change >= 0
  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-1 shadow-xs">
      <p className="text-text-muted text-xs">{label}</p>
      <p className="text-text-primary text-xl font-semibold leading-tight">{value}</p>
      {sub && <p className="text-text-muted text-[11px]">{sub}</p>}
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium pt-0.5 ${up ? 'text-emerald-500' : 'text-red-500'}`}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {up ? '+' : ''}{fmt(change)}% vs mês anterior
        </div>
      )}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
      <p className="text-text-primary text-sm font-medium mb-4">{title}</p>
      {children}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function Financeiro() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    const root = document.documentElement
    if (dark) { root.classList.add('dark'); localStorage.setItem('theme', 'dark') }
    else { root.classList.remove('dark'); localStorage.setItem('theme', 'light') }
  }, [dark])

  const ttStyle = {
    backgroundColor: dark ? '#1a1d27' : '#ffffff',
    border: `1px solid ${dark ? '#2d3139' : '#e5e7eb'}`,
    borderRadius: 8,
    fontSize: 12,
    color: dark ? '#e2e8f0' : '#111827',
  }

  const axisColor = dark ? '#64748b' : '#9ca3af'
  const gridColor = dark ? '#2d3139' : '#f3f4f6'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-text-primary text-lg font-semibold">Financeiro</h1>
          <p className="text-text-muted text-sm">Métricas financeiras do app Mooze</p>
        </div>
        <button
          onClick={() => setDark(d => !d)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary text-xs transition-colors"
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          {dark ? 'Light' : 'Dark'}
        </button>
      </div>

      {/* Tabela diária */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-text-primary text-sm font-medium">Dados diários</p>
            <p className="text-text-muted text-xs mt-0.5">316 registros</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                {['Dia', 'Pix Pagos', 'Pix Processado', 'Nº Transações', 'Taxas (BRL)', '% Volume', 'Taxas DePix'].map(c => (
                  <th key={c} className="text-left text-text-muted text-xs font-medium px-4 py-2.5 whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dailyData.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-2.5 text-text-secondary text-xs whitespace-nowrap">{row.dia}</td>
                  <td className="px-4 py-2.5 text-text-primary text-xs font-medium whitespace-nowrap">{brl(row.pixPagos)}</td>
                  <td className="px-4 py-2.5 text-text-primary text-xs whitespace-nowrap">{brl(row.pixProcessado)}</td>
                  <td className="px-4 py-2.5 text-text-primary text-xs">{row.transacoes}</td>
                  <td className="px-4 py-2.5 text-text-primary text-xs whitespace-nowrap">{brl(row.taxas)}</td>
                  <td className="px-4 py-2.5 text-xs">
                    <span className="text-emerald-500 font-medium">{fmt(row.pct)}%</span>
                  </td>
                  <td className="px-4 py-2.5 text-text-primary text-xs whitespace-nowrap">{brl(row.depix)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI Grid — linha 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Volume total mensal"    value={brl(kpis.volumeMensal.value)}   sub={kpis.volumeMensal.sub} />
        <KpiCard label="Instalações"            value={fmt(kpis.instalacoes.value, 0)} />
        <KpiCard label="Taxas coletadas no mês" value={brl(kpis.taxasMes.value)}       sub={kpis.taxasMes.sub} />
        <KpiCard label="Usuários ativos no mês" value={fmt(kpis.usuariosAtivos.value, 0)} />
      </div>

      {/* KPI Grid — linha 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Volume total"           value={brl(kpis.volumeTotal.value)}     sub={kpis.volumeTotal.sub} />
        <KpiCard label="% sobre o volume"       value={fmt(kpis.percentVolume.value) + '%'} />
        <KpiCard label="Volume médio (D-30)"    value={brl(kpis.volumeMedioD30.value)}  sub={kpis.volumeMedioD30.sub} change={kpis.volumeMedioD30.change} />
        <KpiCard label="Média de taxas (D-30)"  value={brl(kpis.mediaTaxasD30.value)}   sub={kpis.mediaTaxasD30.sub} change={kpis.mediaTaxasD30.change} />
      </div>

      {/* KPI Grid — linha 3 */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Média de sats coletados (D-30)" value={fmt(kpis.mediaSatsD30.value, 0)} sub={kpis.mediaSatsD30.sub} change={kpis.mediaSatsD30.change} />
        <KpiCard label="Média de DePix coletado (D-30)" value={brl(kpis.mediaDepixD30.value)}   sub={kpis.mediaDepixD30.sub} change={kpis.mediaDepixD30.change} />
      </div>

      {/* Charts — 3 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Volume processado por dia">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartVolumeDia} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="l" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} width={46} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number) => [brl(v), 'Volume']} />
              <Bar dataKey="v" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Usuários ativos por dia">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartUsuarios} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="l" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number) => [v, 'Usuários']} />
              <Bar dataKey="v" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Instalações novas por dia">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartInstalacoes} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="l" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number) => [v, 'Instalações']} />
              <Bar dataKey="v" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Volume mensal */}
      <ChartCard title="Volume mensal">
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={chartVolumeMensal} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="l" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} width={56} />
            <Tooltip contentStyle={ttStyle} formatter={(v: number) => [brl(v), 'Volume']} />
            <Bar dataKey="v" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  )
}
