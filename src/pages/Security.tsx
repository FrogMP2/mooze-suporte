import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  AlertOctagon,
  FileWarning,
  Server,
} from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const securityRules = [
  {
    icon: AlertOctagon,
    rule: 'Nunca solicitar seed phrase',
    status: 'enforced',
    description: 'O agente IA está configurado para nunca pedir ou aceitar seed phrases em qualquer contexto.',
  },
  {
    icon: Lock,
    rule: 'Nunca solicitar chave privada',
    status: 'enforced',
    description: 'Chaves privadas são informações sensíveis que jamais devem ser solicitadas.',
  },
  {
    icon: Eye,
    rule: 'Nunca solicitar prints com dados sensíveis',
    status: 'enforced',
    description: 'Screenshots podem conter informações privadas. Nunca solicitar capturas de tela com dados de carteira.',
  },
  {
    icon: FileWarning,
    rule: 'Nunca prometer reversão de transação',
    status: 'enforced',
    description: 'Transações on-chain são irreversíveis. O agente nunca faz promessas sobre reversão.',
  },
  {
    icon: Shield,
    rule: 'Nunca sugerir custódia',
    status: 'enforced',
    description: 'A Mooze é autocustódia. Nunca sugerir que a empresa pode guardar ou gerenciar fundos.',
  },
  {
    icon: ShieldAlert,
    rule: 'Nunca fazer afirmações jurídicas',
    status: 'enforced',
    description: 'O agente não fornece aconselhamento legal ou faz afirmações sobre responsabilidade jurídica.',
  },
]

const privacyFeatures = [
  {
    icon: Server,
    title: 'Processamento 100% Local',
    description: 'Todos os dados são processados na máquina local. Nenhuma informação é enviada para servidores externos.',
  },
  {
    icon: Lock,
    title: 'Banco de Dados Local (SQLite)',
    description: 'E-mails e análises são armazenados em banco SQLite local, sem cloud.',
  },
  {
    icon: Eye,
    title: 'Sem Telemetria',
    description: 'O sistema não coleta dados de uso, métricas ou qualquer informação analítica externa.',
  },
  {
    icon: Shield,
    title: 'Credenciais Seguras',
    description: 'Credenciais IMAP são armazenadas apenas no arquivo .env local, nunca no código.',
  },
]

export default function Security() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Segurança & Privacidade</h1>
        <p className="text-text-muted text-sm mt-0.5">Regras absolutas de segurança e políticas de privacidade</p>
      </div>

      {/* Security Status */}
      <Card className="border-success/30">
        <CardBody>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-success-dim flex items-center justify-center">
              <ShieldCheck size={28} className="text-success" />
            </div>
            <div>
              <h2 className="text-text-primary text-lg font-bold">Status: Todas as regras ativas</h2>
              <p className="text-text-secondary text-sm mt-1">
                {securityRules.length} regras de segurança aplicadas • Processamento 100% local
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Security Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-danger" />
            <h3 className="text-text-primary font-semibold">Regras Absolutas de Segurança</h3>
          </div>
          <p className="text-text-muted text-xs mt-1">Estas regras não podem ser desativadas ou contornadas</p>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-border">
            {securityRules.map((rule, i) => (
              <div key={i} className="px-5 py-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-danger-dim flex items-center justify-center shrink-0">
                  <rule.icon size={18} className="text-danger" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-text-primary text-sm font-medium">{rule.rule}</h4>
                    <Badge variant="success">Ativa</Badge>
                  </div>
                  <p className="text-text-muted text-xs">{rule.description}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-success shrink-0 mt-1" title="Regra ativa" />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-info" />
            <h3 className="text-text-primary font-semibold">Privacidade</h3>
          </div>
          <p className="text-text-muted text-xs mt-1">Como seus dados são protegidos</p>
        </CardHeader>
        <CardBody className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            {privacyFeatures.map((feature, i) => (
              <div key={i} className="px-5 py-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-info-dim flex items-center justify-center shrink-0">
                  <feature.icon size={16} className="text-info" />
                </div>
                <div>
                  <h4 className="text-text-primary text-sm font-medium mb-1">{feature.title}</h4>
                  <p className="text-text-muted text-xs">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Mooze Philosophy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-accent text-lg font-bold">M</span>
            <h3 className="text-text-primary font-semibold">Filosofia Mooze — Diretrizes de Comunicação</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-text-primary text-sm font-medium">Sempre reforçar:</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-text-secondary text-sm">
                  <span className="text-success mt-0.5">•</span>
                  Autocustódia implica responsabilidade do usuário
                </li>
                <li className="flex items-start gap-2 text-text-secondary text-sm">
                  <span className="text-success mt-0.5">•</span>
                  A Mooze não tem acesso aos fundos
                </li>
                <li className="flex items-start gap-2 text-text-secondary text-sm">
                  <span className="text-success mt-0.5">•</span>
                  Transações on-chain são irreversíveis
                </li>
                <li className="flex items-start gap-2 text-text-secondary text-sm">
                  <span className="text-success mt-0.5">•</span>
                  Segurança depende do backup correto
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-text-primary text-sm font-medium">Tom da comunicação:</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-text-secondary text-sm">
                  <span className="text-accent mt-0.5">•</span>
                  Claro e objetivo, nunca defensivo
                </li>
                <li className="flex items-start gap-2 text-text-secondary text-sm">
                  <span className="text-accent mt-0.5">•</span>
                  Educativo, nunca culpabilizante
                </li>
                <li className="flex items-start gap-2 text-text-secondary text-sm">
                  <span className="text-accent mt-0.5">•</span>
                  Profissional e técnico
                </li>
                <li className="flex items-start gap-2 text-text-secondary text-sm">
                  <span className="text-accent mt-0.5">•</span>
                  Empático em casos de perda
                </li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
