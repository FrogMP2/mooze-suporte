import { useState } from 'react'
import {
  FileText,
  Plus,
  Search,
  Edit3,
  Trash2,
  Copy,
  CheckCircle2,
  Star,
} from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge, CategoryBadge } from '@/components/ui/Badge'
import { CATEGORY_LABELS } from '@/types'
import type { EmailCategory, ResponseTemplate } from '@/types'
import { cn } from '@/lib/utils'

const MOCK_TEMPLATES: ResponseTemplate[] = [
  {
    id: '1',
    name: 'Backup de Carteira',
    category: 'duvida_educacional',
    content: `Olá!

Entendemos a importância de manter seus fundos seguros. Para fazer o backup da sua carteira Mooze:

1. Acesse Configurações > Backup
2. Anote as 12 palavras (seed phrase) em um local seguro e offline
3. Nunca compartilhe essas palavras com ninguém
4. Guarde em local físico seguro (papel, metal)

Lembre-se: a Mooze é uma carteira de autocustódia. Isso significa que somente você tem acesso aos seus fundos através dessa seed phrase. Nós não temos acesso a ela e não podemos recuperá-la caso seja perdida.

Ficamos à disposição para mais dúvidas!

Equipe Mooze`,
    usageCount: 45,
    approvalRate: 0.95,
    createdAt: '2026-01-15',
    updatedAt: '2026-02-20',
  },
  {
    id: '2',
    name: 'Transação Pendente',
    category: 'problema_tecnico',
    content: `Olá!

Transações na rede Bitcoin podem levar algum tempo para serem confirmadas, especialmente em momentos de congestionamento da rede.

O que pode estar acontecendo:
- A taxa de mineração escolhida pode estar abaixo da média atual
- A rede pode estar congestionada com muitas transações

O que você pode fazer:
1. Aguarde — a maioria das transações é confirmada em até 24h
2. Verifique o status em um explorador de blocos (mempool.space)
3. Se a transação não confirmar em 72h, ela retornará automaticamente

A Mooze não tem controle sobre o tempo de confirmação das transações on-chain, pois isso depende exclusivamente da rede Bitcoin.

Ficamos à disposição!

Equipe Mooze`,
    usageCount: 38,
    approvalRate: 0.92,
    createdAt: '2026-01-20',
    updatedAt: '2026-02-18',
  },
  {
    id: '3',
    name: 'Perda de Acesso',
    category: 'perda_acesso',
    content: `Olá,

Entendemos que a situação é preocupante e queremos ajudá-lo da melhor forma possível.

A Mooze é uma carteira de autocustódia, o que significa que a segurança dos seus fundos está sob sua responsabilidade. A seed phrase (12 palavras) gerada durante a configuração é a única forma de recuperar o acesso à sua carteira.

Se você possui a seed phrase:
1. Reinstale o aplicativo Mooze
2. Selecione "Recuperar Carteira"
3. Insira suas 12 palavras na ordem correta

Se você não possui a seed phrase:
Infelizmente, por questões de segurança e pela natureza da autocustódia, não é possível recuperar o acesso sem a seed phrase. Nenhuma empresa ou pessoa tem essa capacidade.

Sabemos que essa é uma informação difícil, e estamos aqui para qualquer esclarecimento adicional.

Equipe Mooze`,
    usageCount: 22,
    approvalRate: 0.88,
    createdAt: '2026-01-25',
    updatedAt: '2026-02-15',
  },
  {
    id: '4',
    name: 'Liquid Network',
    category: 'questao_liquid',
    content: `Olá!

A Liquid Network é uma sidechain do Bitcoin que oferece transações mais rápidas e com taxas menores.

Características:
- Confirmações em ~2 minutos (vs ~10 min no Bitcoin)
- Taxas significativamente menores
- Suporte a ativos confidenciais
- Ideal para transações frequentes e de menor valor

Para usar Liquid na Mooze:
1. Você pode receber L-BTC através do endereço Liquid da sua carteira
2. Conversões entre BTC e L-BTC são feitas automaticamente
3. Todas as transações Liquid também são protegidas pela sua seed phrase

Ficamos à disposição para mais dúvidas!

Equipe Mooze`,
    usageCount: 18,
    approvalRate: 0.90,
    createdAt: '2026-02-01',
    updatedAt: '2026-02-19',
  },
]

export default function Templates() {
  const [templates, setTemplates] = useState<ResponseTemplate[]>(MOCK_TEMPLATES)
  const [search, setSearch] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<ResponseTemplate | null>(null)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [filterCategory, setFilterCategory] = useState<EmailCategory | 'all'>('all')

  const filtered = templates.filter((t) => {
    if (search) {
      const q = search.toLowerCase()
      if (!t.name.toLowerCase().includes(q) && !t.content.toLowerCase().includes(q)) return false
    }
    if (filterCategory !== 'all' && t.category !== filterCategory) return false
    return true
  })

  function handleEdit(template: ResponseTemplate) {
    setSelectedTemplate(template)
    setEditContent(template.content)
    setEditing(true)
  }

  function handleSave() {
    if (!selectedTemplate) return
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === selectedTemplate.id
          ? { ...t, content: editContent, updatedAt: new Date().toISOString() }
          : t
      )
    )
    setSelectedTemplate({ ...selectedTemplate, content: editContent })
    setEditing(false)
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-48px)]">
      {/* Template List */}
      <div className="w-80 flex flex-col shrink-0">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-text-primary">Templates</h1>
          <p className="text-text-muted text-sm mt-0.5">Respostas validadas para reutilização</p>
        </div>

        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as EmailCategory | 'all')}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="all">Todas as categorias</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {filtered.map((template) => (
            <div
              key={template.id}
              onClick={() => {
                setSelectedTemplate(template)
                setEditing(false)
              }}
              className={cn(
                'p-4 rounded-lg border cursor-pointer transition-all',
                selectedTemplate?.id === template.id
                  ? 'bg-accent-dim border-accent'
                  : 'bg-surface border-border hover:border-border-hover'
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-text-primary text-sm font-medium">{template.name}</h3>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-warning" />
                  <span className="text-text-muted text-xs">{Math.round(template.approvalRate * 100)}%</span>
                </div>
              </div>
              <CategoryBadge category={template.category} />
              <div className="flex items-center gap-3 mt-2 text-text-muted text-xs">
                <span>Usado {template.usageCount}x</span>
              </div>
            </div>
          ))}
        </div>

        <button className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-border rounded-lg text-text-secondary text-sm hover:border-accent hover:text-accent transition-colors">
          <Plus size={16} />
          Novo Template
        </button>
      </div>

      {/* Template Detail */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedTemplate ? (
          <>
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-text-primary font-semibold">{selectedTemplate.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <CategoryBadge category={selectedTemplate.category} />
                      <Badge variant="default">Usado {selectedTemplate.usageCount}x</Badge>
                      <Badge variant="success">{Math.round(selectedTemplate.approvalRate * 100)}% aprovação</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedTemplate.content)}
                      className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-hover"
                      title="Copiar"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(selectedTemplate)}
                      className="p-2 text-text-muted hover:text-accent rounded-lg hover:bg-surface-hover"
                      title="Editar"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button className="p-2 text-text-muted hover:text-danger rounded-lg hover:bg-surface-hover" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="flex-1 overflow-y-auto">
                {editing ? (
                  <div className="h-full flex flex-col">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent resize-none font-mono"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => setEditing(false)}
                        className="px-4 py-2 text-text-secondary text-sm rounded-lg hover:bg-surface-hover"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover"
                      >
                        <CheckCircle2 size={14} />
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedTemplate.content}
                  </div>
                )}
              </CardBody>
            </Card>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText size={48} className="mx-auto text-text-muted mb-4" />
              <p className="text-text-secondary text-lg">Selecione um template</p>
              <p className="text-text-muted text-sm mt-1">Escolha um template para visualizar ou editar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
