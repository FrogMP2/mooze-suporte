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

// ─── SMTP TRANSPORT ──────────────────────────────────────────

function getSmtpTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.IMAP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || process.env.IMAP_USER,
      pass: process.env.SMTP_PASS || process.env.IMAP_PASS,
    },
    tls: { rejectUnauthorized: false },
  })
}

// ─── SYNC (IMAP → Supabase) ──────────────────────────────────

app.post('/api/sync', async (req, res) => {
  try {
    const result = await syncEmails()
    res.json(result)
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

    // Send via SMTP
    const transport = getSmtpTransport()
    await transport.sendMail({
      from: process.env.SMTP_USER || process.env.IMAP_USER,
      to: email.sender,
      subject: `Re: ${email.subject || ''}`,
      text: content,
      inReplyTo: email.messageId,
      references: email.messageId,
    })

    // Save response + update status in Supabase
    await supabase.from('responses').insert({ emailId, content })
    await supabase
      .from('emails')
      .update({
        status: 'respondido',
        respondedAt: new Date().toISOString(),
        respondedBy: 'operador',
      })
      .eq('id', emailId)

    console.log(`[SMTP] Resposta enviada para ${email.sender}`)
    res.json({ success: true })
  } catch (error) {
    console.error('[SMTP] Erro ao enviar:', error.message)
    res.status(500).json({ message: 'Erro ao enviar resposta', error: error.message })
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

// ─── AUTO-SYNC ────────────────────────────────────────────────

async function autoSync() {
  try {
    const result = await syncEmails()
    if (result.synced > 0) {
      console.log(`[AUTO-SYNC] ${result.synced} novos e-mails sincronizados`)
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
