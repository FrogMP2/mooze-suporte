import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import { syncEmails, testImapConnection } from './imap.js'
import { supabase } from './supabase.js'

dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env' : '../.env' })

const app = express()
const PORT = process.env.PORT || 3001
const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL || '5') * 60 * 1000 // default 5 min

app.use(cors())
app.use(express.json())

// ─── EMAIL SENDING (Resend API or SMTP fallback) ────────────

async function sendEmailViaResend({ to, subject, text, headers }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'Suporte Mooze <suporte@mooze.app>',
      to: [to],
      subject,
      text,
      headers,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Resend API error: ${err.message || res.statusText}`)
  }
  console.log('[RESEND] Email enviado para', to)
  return true
}

async function sendEmailViaSMTP({ to, subject, text, inReplyTo, references }) {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.IMAP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || process.env.IMAP_USER,
      pass: process.env.SMTP_PASS || process.env.IMAP_PASS,
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
  })

  await transport.sendMail({
    from: process.env.SMTP_USER || process.env.IMAP_USER,
    to,
    subject,
    text,
    inReplyTo,
    references,
  })
  console.log('[SMTP] Email enviado para', to)
  return true
}

async function sendEmail({ to, subject, text, inReplyTo, references }) {
  // Try Resend first (works on cloud), then SMTP fallback (works locally)
  try {
    const sent = await sendEmailViaResend({ to, subject, text, headers: { 'In-Reply-To': inReplyTo, 'References': references } })
    if (sent) return
  } catch (e) {
    console.log('[EMAIL] Resend falhou, tentando SMTP...', e.message)
  }

  await sendEmailViaSMTP({ to, subject, text, inReplyTo, references })
}

// ─── SYNC (IMAP → Supabase) ──────────────────────────────────

app.post('/api/sync', async (req, res) => {
  try {
    const result = await syncEmails()
    res.json(result)
    // Auto-analyze new emails in background after responding
    if (result.synced > 0) {
      autoAnalyzeNew().catch(err => console.error('[SYNC] Analyze error:', err.message))
    }
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ message: 'Erro ao sincronizar e-mails', error: error.message })
  }
})

// ─── SEND REPLY ──────────────────────────────────────────────

app.post('/api/send-reply', async (req, res) => {
  try {
    const { emailId, content } = req.body

    // Get original email from Supabase
    const { data: email, error: fetchErr } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .single()

    if (fetchErr || !email) {
      return res.status(404).json({ message: 'E-mail não encontrado' })
    }

    // Send email (tries Resend API first, then SMTP fallback)
    await sendEmail({
      to: email.from,
      subject: `Re: ${email.subject || ''}`,
      text: content,
      inReplyTo: email.messageId,
      references: email.messageId,
    })

    // Save response + update status in Supabase
    const sentUser = process.env.RESEND_FROM || 'suporte@mooze.app'
    await Promise.all([
      supabase.from('responses').insert({ emailId, content }),
      supabase.from('emails').update({
        status: 'respondido',
        respondedAt: new Date().toISOString(),
        respondedBy: 'operador',
      }).eq('id', emailId),
      // Save sent email in emails table with folder 'SENT'
      supabase.from('emails').insert({
        messageId: `sent-${emailId}-${Date.now()}`,
        from: sentUser,
        fromName: 'Equipe Mooze',
        to: email.from,
        subject: `Re: ${email.subject || ''}`,
        body: content,
        date: new Date().toISOString(),
        folder: 'SENT',
        read: true,
        status: 'respondido',
      }),
    ])

    console.log(`[RESEND] Resposta enviada para ${email.from}`)
    res.json({ success: true })
  } catch (error) {
    console.error('[RESEND] Erro ao enviar:', error.message)
    res.status(500).json({ message: 'Erro ao enviar resposta', error: error.message })
  }
})

// ─── SEND NEW EMAIL ─────────────────────────────────────────

app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, body } = req.body

    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'Campos obrigatórios: to, subject, body' })
    }

    await sendEmail({ to, subject, text: body })

    // Save sent email to DB
    const sentUser = process.env.RESEND_FROM || 'suporte@mooze.app'
    const { error } = await supabase.from('emails').insert({
      messageId: `sent-new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      from: sentUser,
      fromName: 'Equipe Mooze',
      to,
      subject,
      body,
      date: new Date().toISOString(),
      folder: 'SENT',
      read: true,
      status: 'respondido',
    })

    if (error) {
      console.error('[SEND] Erro ao salvar email enviado:', error.message)
    }

    console.log(`[SEND] Novo email enviado para ${to}`)
    res.json({ success: true })
  } catch (error) {
    console.error('[SEND] Erro ao enviar:', error.message)
    res.status(500).json({ message: 'Erro ao enviar email', error: error.message })
  }
})

// ─── AI ANALYSIS (Gemini) ────────────────────────────────────

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Gemini API error: ${err.error?.message || res.statusText}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Resposta vazia do Gemini')
  return JSON.parse(text)
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { emailId } = req.body

    // 1. Get the email to analyze
    const { data: email, error: emailErr } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .single()

    if (emailErr || !email) {
      return res.status(404).json({ message: 'E-mail não encontrado' })
    }

    // 2. Load knowledge base for matching
    const { data: kbEntries } = await supabase
      .from('knowledge_base')
      .select('category, title, content')
      .order('updatedAt', { ascending: false })
      .limit(60)

    const kbContext = (kbEntries || []).length > 0
      ? (kbEntries || []).map(k => `### [${k.category}] ${k.title}\n${k.content}`).join('\n\n')
      : 'Sem entradas na base de conhecimento ainda.'

    // 3. Get past emails that HAVE responses (learning context)
    const { data: pastEmails } = await supabase
      .from('responses')
      .select('emailId, content, emails!inner(subject, body, category, from, fromName)')
      .order('createdAt', { ascending: false })
      .limit(30)

    // 4. Get emails in the same category for recurrence check
    const { data: similarEmails } = await supabase
      .from('emails')
      .select('id, subject, from, fromName, date')
      .neq('id', emailId)
      .order('date', { ascending: false })
      .limit(50)

    // 4. Build context from past responses
    const pastExamples = (pastEmails || [])
      .map((r) => {
        const e = r.emails
        return `---\nAssunto: ${e?.subject || '?'}\nEmail: ${(e?.body || '').slice(0, 300)}\nCategoria: ${e?.category || '?'}\nResposta enviada:\n${r.content.slice(0, 500)}`
      })
      .join('\n\n')

    // 5. Build the prompt
    const prompt = `Você é o assistente de suporte da Mooze, uma carteira de autocustódia para Bitcoin e Liquid Network.

Sua tarefa é analisar o e-mail de suporte abaixo e gerar uma resposta inteligente e personalizada.

## Contexto da empresa Mooze:
- Mooze é um app de carteira Bitcoin e Liquid Network
- É autocustódia: o usuário controla suas chaves (seed phrase de 12 palavras)
- Suporta transações on-chain Bitcoin e via Liquid Network (L-BTC)
- Liquid é mais rápido (~2min) e barato que on-chain
- A Mooze NÃO tem acesso aos fundos do usuário em nenhuma hipótese
- A seed phrase é a ÚNICA forma de recuperar a carteira

## E-mail para analisar:
De: ${email.fromName || email.from}
Assunto: ${email.subject || 'Sem assunto'}
Corpo:
${(email.body || '').slice(0, 2000)}

## Base de Conhecimento (respostas padronizadas do suporte Mooze):
${kbContext}

## Histórico de respostas anteriores (aprenda o tom e estilo):
${pastExamples || 'Nenhum histórico disponível ainda.'}

## Emails recentes (para detectar padrões recorrentes):
${(similarEmails || []).slice(0, 20).map((e) => `- ${e.subject} (de ${e.fromName || e.from}, ${e.date})`).join('\n') || 'Nenhum.'}

## Instruções:
1. Classifique o email em UMA das categorias: problema_tecnico, duvida_educacional, erro_transacao, confusao_taxas, problema_sincronizacao, questao_liquid, suspeita_bug, reclamacao, sugestao_melhoria, seguranca, perda_acesso, outro
2. Determine a urgência: baixa, media, alta, critica
3. Determine o risco: nenhum, tecnico, reputacional, juridico
4. Verifique se existe na Base de Conhecimento uma entrada que responde diretamente ao problema do usuário:
   - Se SIM: kbMatched=true, use o conteúdo da KB como base para suggestedResponse (personalize o tom mas mantenha as instruções/links)
   - Se NÃO (problema inédito, caso complexo, banimento, jurídico, etc): kbMatched=false, escreva resposta do zero
5. Escreva uma resposta PERSONALIZADA para este email específico (não genérica!)
   - Use o tom e estilo das respostas anteriores se disponíveis
   - Aborde ESPECIFICAMENTE o problema descrito pelo usuário
   - Inclua passos concretos para resolver a situação dele
   - Assine como "Equipe Mooze"
6. Descreva ações internas que a equipe deve tomar
7. Verifique se é um problema recorrente baseado nos emails similares
8. Extraia as palavras-chave relevantes do email

Responda APENAS com JSON válido neste formato:
{
  "category": "categoria_aqui",
  "urgency": "nivel_aqui",
  "risk": "risco_aqui",
  "summary": "resumo curto do problema em 1 frase",
  "kbMatched": true,
  "suggestedResponse": "resposta completa e personalizada aqui",
  "internalAction": "ações internas para a equipe",
  "isRecurrent": false,
  "recurrentPattern": null,
  "confidence": 0.95,
  "keywords": ["palavra1", "palavra2"]
}`

    // 6. Call Gemini
    console.log(`[AI] Analisando email ${emailId}...`)
    const analysis = await callGemini(prompt)

    // 7. Save analysis to Supabase
    const kbPrefix = analysis.kbMatched ? '[KB:yes] ' : '[KB:no] '
    await supabase
      .from('emails')
      .update({
        category: analysis.category,
        urgency: analysis.urgency,
        risk: analysis.risk,
        suggestedResponse: analysis.suggestedResponse,
        internalAction: kbPrefix + (analysis.internalAction || ''),
        isRecurrent: analysis.isRecurrent || false,
        recurrentPattern: analysis.recurrentPattern || null,
        status: 'em_analise',
      })
      .eq('id', emailId)

    console.log(`[AI] Email ${emailId} → ${analysis.category} (${analysis.urgency}) KB:${analysis.kbMatched ? 'matched' : 'no_match'}`)

    res.json({
      emailId,
      ...analysis,
      responseSource: 'ai',
    })
  } catch (error) {
    console.error('[AI] Erro na análise:', error.message)
    res.status(500).json({ message: 'Erro na análise AI', error: error.message })
  }
})

app.post('/api/analyze-all', async (req, res) => {
  try {
    // Get all unanalyzed emails
    const { data: emails, error } = await supabase
      .from('emails')
      .select('id')
      .is('category', null)
      .order('date', { ascending: false })
      .limit(50)

    if (error) throw new Error(error.message)
    if (!emails?.length) return res.json({ analyzed: 0 })

    let analyzed = 0
    for (const email of emails) {
      try {
        // Call the analyze endpoint internally
        const analyzeRes = await fetch(`http://localhost:${PORT}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId: email.id }),
        })
        if (analyzeRes.ok) analyzed++
      } catch { /* skip individual failures */ }
    }

    res.json({ analyzed, total: emails.length })
  } catch (error) {
    console.error('[AI] Erro análise em massa:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// ─── AGENT CHAT ──────────────────────────────────────────────

app.post('/api/agent-chat', async (req, res) => {
  try {
    const { message, action } = req.body

    // Fetch context data from Supabase (direct queries, no RPCs needed)
    const [recentRes, totalRes, unreadRes, criticalRes, pendingRes, knowledgeRes] = await Promise.all([
      supabase.from('emails').select('id, subject, from, fromName, category, urgency, risk, status, date, body').order('date', { ascending: false }).limit(30),
      supabase.from('emails').select('id', { count: 'exact', head: true }),
      supabase.from('emails').select('id', { count: 'exact', head: true }).eq('read', false),
      supabase.from('emails').select('id', { count: 'exact', head: true }).eq('urgency', 'critica'),
      supabase.from('emails').select('id', { count: 'exact', head: true }).in('status', ['novo', 'em_analise']),
      supabase.from('knowledge_base').select('category, title, content').order('updatedAt', { ascending: false }).limit(50),
    ])

    const recentEmails = recentRes.data || []
    const totalEmails = totalRes.count || 0
    const unread = unreadRes.count || 0
    const critical = criticalRes.count || 0
    const pendingResponse = pendingRes.count || 0
    const knowledgeEntries = knowledgeRes.data || []

    // Get today's emails
    const today = new Date().toISOString().split('T')[0]
    const todayEmails = recentEmails.filter((e) => e.date?.startsWith(today))

    // Get risk emails
    const riskEmails = recentEmails.filter((e) => e.risk && e.risk !== 'nenhum')

    // Get unresolved critical
    const criticalEmails = recentEmails.filter((e) => e.urgency === 'critica' && e.status !== 'respondido' && e.status !== 'resolvido')

    // Build knowledge base context
    const knowledgeContext = knowledgeEntries.length > 0
      ? `\n## Base de Conhecimento (Memória do Agente):\n${knowledgeEntries.map((k) => `### [${k.category}] ${k.title}\n${k.content}`).join('\n\n')}\n`
      : ''

    const contextData = `
## Dashboard Stats:
- Total de emails: ${totalEmails}
- Não lidos: ${unread}
- Críticos: ${critical}
- Pendentes resposta: ${pendingResponse}

## Emails de hoje (${todayEmails.length}):
${todayEmails.map((e) => `- [${e.urgency || '?'}] ${e.subject} (de ${e.fromName || e.from}) - Status: ${e.status}`).join('\n') || 'Nenhum email hoje.'}

## Emails críticos não resolvidos (${criticalEmails.length}):
${criticalEmails.map((e) => `- ${e.subject} (de ${e.fromName || e.from}) - ${e.category || 'não classificado'}`).join('\n') || 'Nenhum.'}

## Emails com risco (${riskEmails.length}):
${riskEmails.map((e) => `- [${e.risk}] ${e.subject} (de ${e.fromName || e.from})`).join('\n') || 'Nenhum.'}

## Últimos 30 emails (use o ID para ações):
${recentEmails.map((e) => `- ID:${e.id} [${e.status}] [${e.category || '?'}] "${e.subject}" de ${e.fromName || e.from} <${e.from}> (${e.date}) - ${(e.body || '').slice(0, 150)}`).join('\n') || 'Nenhum email encontrado.'}
`

    let userPrompt = message
    if (action) {
      const actionPrompts = {
        analyze_all: 'Faça uma análise geral de todos os emails recentes. Quais precisam de atenção imediata? Quais padrões você identifica?',
        detect_patterns: 'Analise os emails e identifique padrões recorrentes. Quais problemas se repetem? Quais são as tendências?',
        risk_report: 'Gere um relatório de riscos. Quais emails apresentam risco jurídico, reputacional ou técnico? Qual a prioridade de cada um?',
        generate_faq: 'Baseado nos emails recebidos, gere uma FAQ com as 10 perguntas mais frequentes e suas respostas recomendadas.',
        security_audit: 'Faça uma auditoria de segurança nos emails. Identifique possíveis tentativas de phishing, engenharia social ou ameaças.',
        daily_summary: 'Gere um resumo operacional do dia: quantos emails, quais categorias, pendências, ações recomendadas.',
      }
      userPrompt = actionPrompts[action] || message
    }

    const prompt = `Você é o Agente de Inteligência de Suporte da Mooze, uma carteira de autocustódia para Bitcoin e Liquid Network.

Você tem acesso a dados reais do sistema de suporte e a uma base de conhecimento com informações da empresa. Use SEMPRE esses dados para responder de forma precisa e útil.
${knowledgeContext}
${contextData}

## Solicitação do operador:
${userPrompt}

## Instruções:
- Responda de forma direta, profissional e acionável
- Use os dados reais fornecidos acima
- Formate com markdown: **negrito** para destaques, listas com • ou números
- Se identificar situações críticas, destaque-as
- Dê recomendações concretas e priorizadas
- Responda em português brasileiro
- Seja conciso mas completo

## AÇÕES AUTÔNOMAS DO AGENTE

Você tem autonomia para executar ações reais. Quando o operador pedir ações, retorne SOMENTE JSON puro (sem markdown, sem texto fora do JSON).

### Formato multi_action (combinação de ações):
{"action":"multi_action","summary":"O que será feito","actions":[...],"reason":"Justificativa"}

### Tipos de ação:
reply_email: {"type":"reply_email","emailId":"ID","subject":"Assunto","body":"Corpo assinado Equipe Mooze"}
move_email: {"type":"move_email","emailId":"ID","folder":"Archive"} (pastas: Archive, INBOX, SPAM, TRASH)
delete_email: {"type":"delete_email","emailId":"ID"}
bulk_send: {"type":"bulk_send","subject":"Assunto","body":"Corpo","recipients":[{"email":"x@y.com","name":"Nome"}]}

### Exemplo combinado (responder + arquivar):
{"action":"multi_action","summary":"Responderei 2 emails sobre swap e arquivarei","actions":[{"type":"reply_email","emailId":"abc","subject":"Re: Swap","body":"Olá...\n\nEquipe Mooze"},{"type":"move_email","emailId":"abc","folder":"Archive"}],"reason":"2 emails sobre swap travado encontrados"}

### Disparo simples:
{"action":"bulk_send","subject":"Assunto","body":"Corpo","recipients":[{"email":"x@y.com","name":"Nome"}],"reason":"Justificativa"}

REGRAS:
- JSON puro, sem code fences
- Use APENAS IDs reais dos dados acima
- NÃO invente IDs, emails ou nomes
- Para delete, seja conservador e justifique
- Se não tiver certeza dos IDs, responda em texto pedindo confirmação`

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 16384 },
      }),
    })

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}))
      throw new Error(`Gemini API error: ${err.error?.message || geminiRes.statusText}`)
    }

    const geminiData = await geminiRes.json()
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Não foi possível gerar resposta.'

    res.json({ response: responseText })
  } catch (error) {
    console.error('[AGENT] Erro:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// ─── BULK SEND ──────────────────────────────────────────────

app.post('/api/bulk-send', async (req, res) => {
  try {
    const { recipients, subject, body } = req.body

    if (!recipients?.length || !subject || !body) {
      return res.status(400).json({ message: 'Campos obrigatórios: recipients, subject, body' })
    }

    if (recipients.length > 20) {
      return res.status(400).json({ message: 'Máximo de 20 destinatários por envio' })
    }

    let sent = 0
    let failed = 0
    const errors = []

    for (const recipient of recipients) {
      try {
        await sendEmail({ to: recipient.email, subject, text: body })

        // Save sent email to DB
        const sentUser = process.env.RESEND_FROM || 'suporte@mooze.app'
        await supabase.from('emails').insert({
          messageId: `sent-bulk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          from: sentUser,
          fromName: 'Equipe Mooze',
          to: recipient.email,
          subject,
          body,
          date: new Date().toISOString(),
          folder: 'SENT',
          read: true,
          status: 'respondido',
        })

        sent++
        console.log(`[BULK] Email enviado para ${recipient.email}`)
      } catch (err) {
        failed++
        errors.push({ email: recipient.email, error: err.message })
        console.error(`[BULK] Falha ao enviar para ${recipient.email}:`, err.message)
      }

      // Delay 1s between sends to avoid rate limits
      if (recipients.indexOf(recipient) < recipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    console.log(`[BULK] Concluído: ${sent} enviados, ${failed} falharam`)
    res.json({ sent, failed, errors })
  } catch (error) {
    console.error('[BULK] Erro:', error.message)
    res.status(500).json({ message: 'Erro no envio em massa', error: error.message })
  }
})

// ─── MOVE EMAIL ──────────────────────────────────────────────

app.post('/api/move-email', async (req, res) => {
  try {
    const { emailId, folder } = req.body
    if (!emailId || !folder) return res.status(400).json({ message: 'emailId e folder obrigatórios' })

    const { error } = await supabase.from('emails').update({ folder }).eq('id', emailId)
    if (error) throw new Error(error.message)

    console.log(`[MOVE] Email ${emailId} → ${folder}`)
    res.json({ success: true })
  } catch (error) {
    console.error('[MOVE] Erro:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// ─── DELETE EMAIL ─────────────────────────────────────────────

app.post('/api/delete-email', async (req, res) => {
  try {
    const { emailId } = req.body
    if (!emailId) return res.status(400).json({ message: 'emailId obrigatório' })

    const { error } = await supabase.from('emails').update({ folder: 'TRASH', status: 'deletado' }).eq('id', emailId)
    if (error) throw new Error(error.message)

    console.log(`[DELETE] Email ${emailId} movido para TRASH`)
    res.json({ success: true })
  } catch (error) {
    console.error('[DELETE] Erro:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// ─── AGENT REPLY ──────────────────────────────────────────────

app.post('/api/agent-reply', async (req, res) => {
  try {
    const { emailId, subject, body } = req.body
    if (!emailId || !body) return res.status(400).json({ message: 'emailId e body obrigatórios' })

    const { data: email, error: fetchErr } = await supabase.from('emails').select('*').eq('id', emailId).single()
    if (fetchErr || !email) return res.status(404).json({ message: 'E-mail não encontrado' })

    await sendEmail({
      to: email.from,
      subject: subject || `Re: ${email.subject || ''}`,
      text: body,
      inReplyTo: email.messageId,
      references: email.messageId,
    })

    const sentUser = process.env.RESEND_FROM || 'suporte@mooze.app'
    await Promise.all([
      supabase.from('emails').update({ status: 'respondido', respondedAt: new Date().toISOString(), respondedBy: 'agente' }).eq('id', emailId),
      supabase.from('emails').insert({
        messageId: `agent-reply-${emailId}-${Date.now()}`,
        from: sentUser, fromName: 'Equipe Mooze',
        to: email.from, subject: subject || `Re: ${email.subject || ''}`,
        body, date: new Date().toISOString(), folder: 'SENT', read: true, status: 'respondido',
      }),
    ])

    console.log(`[AGENT-REPLY] Resposta enviada para ${email.from}`)
    res.json({ success: true })
  } catch (error) {
    console.error('[AGENT-REPLY] Erro:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// ─── MULTI ACTION (executa lista de ações do agente) ──────────

app.post('/api/multi-action', async (req, res) => {
  try {
    const { actions } = req.body
    if (!actions?.length) return res.status(400).json({ message: 'actions obrigatório' })

    const results = []

    for (const action of actions) {
      try {
        if (action.type === 'reply_email') {
          const r = await fetch(`http://localhost:${PORT}/api/agent-reply`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailId: action.emailId, subject: action.subject, body: action.body }),
          })
          results.push({ type: action.type, emailId: action.emailId, success: r.ok })
        } else if (action.type === 'move_email') {
          const r = await fetch(`http://localhost:${PORT}/api/move-email`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailId: action.emailId, folder: action.folder }),
          })
          results.push({ type: action.type, emailId: action.emailId, success: r.ok })
        } else if (action.type === 'delete_email') {
          const r = await fetch(`http://localhost:${PORT}/api/delete-email`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailId: action.emailId }),
          })
          results.push({ type: action.type, emailId: action.emailId, success: r.ok })
        } else if (action.type === 'bulk_send') {
          const r = await fetch(`http://localhost:${PORT}/api/bulk-send`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipients: action.recipients, subject: action.subject, body: action.body }),
          })
          const data = await r.json()
          results.push({ type: action.type, success: r.ok, ...data })
        }
      } catch (err) {
        results.push({ type: action.type, emailId: action.emailId, success: false, error: err.message })
      }
    }

    const succeeded = results.filter(r => r.success).length
    console.log(`[MULTI-ACTION] ${succeeded}/${results.length} ações executadas`)
    res.json({ success: true, results, succeeded, total: results.length })
  } catch (error) {
    console.error('[MULTI-ACTION] Erro:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// ─── TEST IMAP ────────────────────────────────────────────────

app.post('/api/test-imap', async (req, res) => {
  try {
    const config = req.body
    const result = await testImapConnection(config)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ─── HEALTH CHECK ─────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'mooze-suporte-sync' })
})

// ─── AUTO-ANALYZE ─────────────────────────────────────────────

async function autoAnalyzeNew() {
  try {
    const { data: emails } = await supabase
      .from('emails')
      .select('id')
      .is('category', null)
      .eq('folder', 'INBOX')
      .order('date', { ascending: false })
      .limit(10)

    if (!emails?.length) return
    console.log(`[AUTO-ANALYZE] Analisando ${emails.length} novos emails...`)

    for (const email of emails) {
      try {
        await fetch(`http://localhost:${PORT}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId: email.id }),
        })
        // 3s delay between calls to respect Gemini rate limits
        await new Promise(resolve => setTimeout(resolve, 3000))
      } catch (e) {
        console.error(`[AUTO-ANALYZE] Falha ao analisar ${email.id}:`, e.message)
      }
    }
    console.log(`[AUTO-ANALYZE] Concluído`)
  } catch (error) {
    console.error('[AUTO-ANALYZE] Erro:', error.message)
  }
}

// ─── AUTO-SYNC ────────────────────────────────────────────────

async function autoSync() {
  try {
    const result = await syncEmails()
    if (result.synced > 0) {
      console.log(`[AUTO-SYNC] ${result.synced} novos e-mails sincronizados`)
      // Auto-analyze new emails in background
      autoAnalyzeNew().catch(err => console.error('[AUTO-SYNC] Analyze error:', err.message))
    }
  } catch (error) {
    console.error('[AUTO-SYNC] Erro:', error.message)
  }
}

// ─── START ────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   Mooze Suporte - Sync Worker           ║
║   http://localhost:${PORT}                 ║
║   IMAP → Supabase + SMTP               ║
║   Auto-sync: a cada ${SYNC_INTERVAL / 60000} min              ║
╚══════════════════════════════════════════╝
  `)

  // First sync on startup
  autoSync()

  // Auto-sync interval
  setInterval(autoSync, SYNC_INTERVAL)
})
