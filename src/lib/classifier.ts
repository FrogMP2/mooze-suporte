import { supabase } from './supabase'
import type { Email, EmailCategory, UrgencyLevel, RiskType } from '@/types'

// ─── KEYWORD PATTERNS FOR CLASSIFICATION ────────────────────

const CATEGORY_PATTERNS: Record<string, string[]> = {
  problema_tecnico: [
    'erro', 'bug', 'falha', 'crash', 'travou', 'não funciona', 'problema',
    'não abre', 'não carrega', 'tela branca', 'fecha sozinho', 'instável',
  ],
  duvida_educacional: [
    'como', 'o que é', 'funciona', 'explicar', 'entender', 'tutorial',
    'onde fica', 'como faço', 'dúvida', 'ajuda', 'primeiro', 'iniciante',
  ],
  erro_transacao: [
    'transação', 'envio', 'recebimento', 'pendente', 'confirmação',
    'não chegou', 'enviou errado', 'endereço errado', 'txid', 'hash',
    'mempool', 'confirmando', 'não confirmou',
  ],
  confusao_taxas: [
    'taxa', 'fee', 'caro', 'custo', 'quanto custa', 'preço',
    'cobrança', 'desconto', 'mineração', 'sat/vb', 'sats',
  ],
  problema_sincronizacao: [
    'sincroniz', 'saldo errado', 'não atualiza', 'desatualizad',
    'saldo diferente', 'não aparece', 'sumiu', 'zerou',
  ],
  questao_liquid: [
    'liquid', 'l-btc', 'lbtc', 'sidechain', 'peg-in', 'peg-out',
    'rede liquid', 'confidential',
  ],
  suspeita_bug: [
    'bug', 'defeito', 'sempre acontece', 'reproduzir', 'toda vez',
    'comportamento estranho', 'inesperado',
  ],
  reclamacao: [
    'reclamação', 'insatisfeito', 'péssimo', 'horrível', 'absurdo',
    'vergonha', 'nunca mais', 'pior', 'decepcion',
  ],
  sugestao_melhoria: [
    'sugestão', 'sugiro', 'seria bom', 'poderiam', 'melhoria',
    'feature', 'funcionalidade', 'gostaria', 'seria legal',
  ],
  seguranca: [
    'segurança', 'hack', 'invadi', 'roubaram', 'phishing',
    'suspeito', 'autorização', 'acesso indevido',
  ],
  perda_acesso: [
    'perdi', 'esqueci', 'não consigo entrar', 'não lembro',
    'seed', 'backup', 'recuperar', 'restaurar', 'acesso',
    'senha', 'pin', 'bloqueado',
  ],
}

const CRITICAL_KEYWORDS = [
  'fundos desapareceram', 'fundos sumiram', 'perdi tudo', 'perdi meus bitcoin',
  'roubaram', 'hackearam', 'hack', 'perda de acesso', 'não consigo acessar',
  'transação errada', 'enviei para endereço errado', 'erro urgente',
  'travou com saldo', 'saldo sumiu', 'emergência', 'urgente',
]

const HIGH_KEYWORDS = [
  'transação pendente', 'não confirmou', 'demora', 'importante',
  'preciso resolver', 'saldo errado', 'erro de transação',
]

const RISK_KEYWORDS: Record<string, string[]> = {
  juridico: ['processo', 'procon', 'regulador', 'advogado', 'judicial', 'justiça', 'indenização', 'lei'],
  reputacional: ['redes sociais', 'twitter', 'instagram', 'youtube', 'influenciador', 'público', 'vou postar', 'vou expor', 'reclame aqui'],
  tecnico: ['bug', 'falha sistêmica', 'todos os usuários', 'vários relatos', 'atualização'],
}

// ─── RESPONSE TEMPLATES (fallback) ─────────────────────────

const RESPONSE_TEMPLATES: Record<string, string> = {
  problema_tecnico: `Olá!\n\nAgradecemos por relatar essa questão técnica. Vamos ajudá-lo a resolver.\n\nPara que possamos entender melhor o problema, poderia nos informar:\n1. Qual versão do app Mooze você está usando?\n2. Qual é o modelo e sistema operacional do seu dispositivo?\n3. O problema acontece de forma consistente ou intermitente?\n\nEnquanto investigamos, sugerimos:\n- Verificar se há atualizações disponíveis do app\n- Reiniciar o aplicativo\n\nEstamos à disposição para ajudar!\n\nEquipe Mooze`,
  duvida_educacional: `Olá!\n\nFicamos felizes em ajudar com sua dúvida. A Mooze é uma carteira de autocustódia para Bitcoin e Liquid Network.\n\nIsso significa que:\n- Você tem controle total dos seus fundos\n- Ninguém além de você pode acessá-los\n- A segurança depende do seu backup (seed phrase de 12 palavras)\n\nPara mais informações, acesse nosso guia no app em Configurações > Ajuda.\n\nSe tiver mais dúvidas, estamos aqui!\n\nEquipe Mooze`,
  erro_transacao: `Olá!\n\nEntendemos a preocupação com sua transação. Vamos ajudar a esclarecer a situação.\n\nTransações na rede Bitcoin podem levar algum tempo para serem confirmadas. O tempo depende de:\n- Taxa de mineração utilizada\n- Congestionamento atual da rede\n\nO que sugerimos:\n1. Verifique o status da transação em mempool.space usando o TXID\n2. Se a taxa estava baixa, a transação pode demorar mais\n3. Transações não confirmadas em 72h geralmente retornam\n\nImportante: transações confirmadas na blockchain são irreversíveis.\n\nFicamos à disposição!\n\nEquipe Mooze`,
  confusao_taxas: `Olá!\n\nEntendemos sua dúvida sobre as taxas. Vamos esclarecer:\n\nA Mooze não cobra taxas próprias para transações. O que você vê é a taxa de mineração da rede Bitcoin, que é paga diretamente aos mineradores.\n\nEssa taxa varia conforme:\n- Congestionamento da rede\n- Prioridade escolhida (rápida/normal/econômica)\n- Tamanho da transação em bytes\n\nDica: Para transações com taxas menores e mais rápidas, considere usar a Liquid Network disponível no app.\n\nFicamos à disposição!\n\nEquipe Mooze`,
  problema_sincronizacao: `Olá!\n\nEntendemos que o saldo não está exibindo corretamente. Isso pode acontecer por questões de sincronização.\n\nSugestões:\n1. Puxe a tela para baixo para forçar uma atualização\n2. Verifique sua conexão com a internet\n3. Feche e reabra o aplicativo\n4. Se o problema persistir, tente desinstalar e reinstalar o app\n\nImportante: Seus fundos estão seguros na blockchain. O saldo exibido é apenas uma visualização. Desde que você tenha seu backup (seed phrase), seus fundos estão acessíveis.\n\nFicamos à disposição!\n\nEquipe Mooze`,
  questao_liquid: `Olá!\n\nÓtima pergunta sobre a Liquid Network! Vamos explicar:\n\nA Liquid é uma sidechain do Bitcoin que oferece:\n- Transações mais rápidas (~2 minutos)\n- Taxas significativamente menores\n- Transações confidenciais\n\nNa Mooze, você pode usar Liquid para:\n- Enviar e receber L-BTC\n- Fazer transações rápidas e baratas\n- Converter entre BTC e L-BTC\n\nSeus L-BTC são protegidos pela mesma seed phrase da sua carteira principal.\n\nFicamos à disposição para mais dúvidas!\n\nEquipe Mooze`,
  perda_acesso: `Olá,\n\nEntendemos que a situação é preocupante e queremos ajudá-lo da melhor forma possível.\n\nA Mooze é uma carteira de autocustódia, o que significa que a seed phrase (12 palavras) é a única forma de recuperar o acesso à sua carteira.\n\nSe você possui a seed phrase:\n1. Reinstale o aplicativo Mooze\n2. Selecione "Recuperar Carteira"\n3. Insira suas 12 palavras na ordem correta\n\nSe você não possui a seed phrase:\nPela natureza da autocustódia e da segurança do Bitcoin, não é possível recuperar o acesso sem ela. Nenhuma empresa ou pessoa tem essa capacidade — esta é uma característica fundamental de segurança.\n\nSabemos que é uma informação difícil. Estamos aqui para qualquer esclarecimento.\n\nEquipe Mooze`,
  reclamacao: `Olá,\n\nAgradecemos por compartilhar seu feedback. Levamos cada retorno muito a sério.\n\nEntendemos sua frustração e gostaríamos de ajudar a resolver a situação da melhor forma possível.\n\nPoderia nos detalhar:\n1. O que especificamente aconteceu?\n2. Quando o problema ocorreu?\n3. Que resultado você esperava?\n\nSua opinião é fundamental para melhorarmos nosso serviço. Vamos analisar sua situação com atenção.\n\nEquipe Mooze`,
  seguranca: `Olá,\n\nLevamos questões de segurança com máxima seriedade. Vamos analisar sua situação.\n\nRecomendações imediatas:\n1. Não clique em links suspeitos\n2. Nunca compartilhe sua seed phrase com ninguém\n3. A Mooze nunca solicita sua seed phrase ou chave privada\n4. Verifique se está usando o app oficial\n\nSe suspeitar de acesso indevido:\n- Transfira seus fundos para uma nova carteira imediatamente\n- Gere uma nova seed phrase\n\nLembre-se: a Mooze não tem acesso aos seus fundos em nenhuma circunstância.\n\nFicamos à disposição para ajudar com qualquer verificação.\n\nEquipe Mooze`,
  sugestao_melhoria: `Olá!\n\nMuito obrigado pela sugestão! Adoramos receber feedback dos nossos usuários.\n\nSua sugestão foi registrada e será encaminhada para nossa equipe de produto. Cada feedback é analisado e considerado no planejamento de futuras atualizações.\n\nContinue nos enviando suas ideias — são fundamentais para construirmos uma experiência cada vez melhor.\n\nEquipe Mooze`,
  outro: `Olá!\n\nAgradecemos por entrar em contato com o suporte Mooze.\n\nRecebemos sua mensagem e vamos analisá-la. Se puder fornecer mais detalhes sobre sua questão, isso nos ajudará a dar uma resposta mais precisa.\n\nFicamos à disposição!\n\nEquipe Mooze`,
}

// ─── ANALYSIS ENGINE ────────────────────────────────────────

export interface AnalysisResult {
  emailId: string
  category: EmailCategory
  urgency: UrgencyLevel
  risk: RiskType
  summary: string
  suggestedResponse: string
  responseSource: 'learned' | 'template'
  internalAction: string
  isRecurrent: boolean
  recurrentPattern: string | null
  confidence: number
  keywords: string[]
}

export async function analyzeEmail(email: Email): Promise<AnalysisResult> {
  const text = `${email.subject || ''} ${email.body || ''}`.toLowerCase()

  // Classify category
  let category: EmailCategory = 'outro'
  let maxScore = 0
  for (const [cat, keywords] of Object.entries(CATEGORY_PATTERNS)) {
    const score = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0)
    if (score > maxScore) {
      maxScore = score
      category = cat as EmailCategory
    }
  }

  // Detect urgency
  let urgency: UrgencyLevel = 'baixa'
  const isCritical = CRITICAL_KEYWORDS.some((kw) => text.includes(kw))
  const isHigh = HIGH_KEYWORDS.some((kw) => text.includes(kw))
  if (isCritical) urgency = 'critica'
  else if (isHigh) urgency = 'alta'
  else if (maxScore >= 3) urgency = 'media'

  // Detect risk
  let risk: RiskType = 'nenhum'
  for (const [riskType, keywords] of Object.entries(RISK_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      risk = riskType as RiskType
      break
    }
  }

  // Get smart response (learned from DB or fallback to template)
  let suggestedResponse = RESPONSE_TEMPLATES[category] || RESPONSE_TEMPLATES.outro
  let responseSource: 'learned' | 'template' = 'template'

  try {
    const { data } = await supabase.rpc('get_learned_response', { cat: category })
    if (data?.response) {
      suggestedResponse = data.response
      responseSource = 'learned'
    }
  } catch { /* fallback to template */ }

  // Internal action
  let internalAction = ''
  if (urgency === 'critica') {
    internalAction = 'ATENÇÃO: Caso crítico. Verificar logs e status do sistema. Priorizar resposta imediata.'
  }
  if (risk === 'juridico') {
    internalAction += ' RISCO JURÍDICO: Encaminhar para equipe jurídica/compliance.'
  }
  if (risk === 'reputacional') {
    internalAction += ' RISCO REPUTACIONAL: Monitorar menções em redes sociais. Responder com prioridade.'
  }

  // Detect recurrence via Supabase
  let isRecurrent = false
  let recurrentPattern: string | null = null

  try {
    const { data } = await supabase.rpc('check_recurrence', { cat: category, email_id: email.id })
    if (data && data >= 3) {
      isRecurrent = true
      recurrentPattern = `${data} e-mails similares na categoria "${category}"`
    }
  } catch { /* skip */ }

  // Extract matched keywords
  const allKeywords = Object.values(CATEGORY_PATTERNS).flat()
  const matchedKeywords = allKeywords.filter((kw) => text.includes(kw))

  return {
    emailId: email.id,
    category,
    urgency,
    risk,
    summary: (email.subject || 'Sem assunto').slice(0, 200),
    suggestedResponse,
    responseSource,
    internalAction: internalAction.trim() || 'Nenhuma ação interna necessária.',
    isRecurrent,
    recurrentPattern,
    confidence: Math.min(maxScore / 3, 1),
    keywords: matchedKeywords.slice(0, 10),
  }
}
