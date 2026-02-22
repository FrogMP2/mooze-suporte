import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { syncEmails, testImapConnection } from './imap.js'

dotenv.config({ path: '../.env' })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

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

// ─── START ────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   Mooze Suporte - Sync Worker           ║
║   http://localhost:${PORT}                 ║
║   IMAP → Supabase                       ║
╚══════════════════════════════════════════╝
  `)
})
