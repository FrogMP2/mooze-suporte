import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { supabase } from './supabase.js'

function getImapConfig(overrides = {}) {
  return {
    user: overrides.user || process.env.IMAP_USER,
    password: overrides.pass || process.env.IMAP_PASS,
    host: overrides.host || process.env.IMAP_HOST,
    port: parseInt(overrides.port || process.env.IMAP_PORT || '993'),
    tls: overrides.tls !== undefined ? overrides.tls : process.env.IMAP_TLS !== 'false',
    tlsOptions: { rejectUnauthorized: false },
    connTimeout: 15000,
    authTimeout: 10000,
  }
}

export function testImapConnection(config = {}) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(getImapConfig(config))

    imap.once('ready', () => {
      console.log('[IMAP] Conexão de teste OK')
      imap.end()
      resolve({ success: true, message: 'Conexão IMAP estabelecida com sucesso' })
    })

    imap.once('error', (err) => {
      console.error('[IMAP] Erro de teste:', err.message)
      reject(new Error(`Falha na conexão: ${err.message}`))
    })

    imap.connect()
  })
}

export function syncEmails(folder = 'INBOX') {
  return new Promise((resolve, reject) => {
    const imap = new Imap(getImapConfig())
    let synced = 0

    imap.once('ready', () => {
      console.log('[IMAP] Conectado ao servidor')

      imap.openBox(folder, true, (err, box) => {
        if (err) {
          console.error('[IMAP] Erro ao abrir box:', err)
          imap.end()
          return reject(err)
        }

        const total = box.messages.total
        console.log(`[IMAP] ${folder} aberto: ${total} mensagens`)

        if (total === 0) {
          imap.end()
          return resolve({ synced: 0, total: 0 })
        }

        // Fetch last 100 messages using sequence numbers
        const fetchFrom = Math.max(1, total - 99)
        const fetchRange = `${fetchFrom}:*`
        console.log(`[IMAP] Buscando range: ${fetchRange}`)

        const f = imap.seq.fetch(fetchRange, {
          bodies: '',
          struct: true,
        })

        const rawEmails = []

        f.on('message', (msg) => {
          const chunks = []

          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              chunks.push(chunk)
            })
          })

          msg.once('end', () => {
            const raw = Buffer.concat(chunks)
            rawEmails.push(raw)
          })
        })

        f.once('error', (fetchErr) => {
          console.error('[IMAP] Fetch error:', fetchErr)
          imap.end()
          reject(fetchErr)
        })

        f.once('end', async () => {
          console.log(`[IMAP] ${rawEmails.length} mensagens baixadas, processando...`)

          for (const raw of rawEmails) {
            try {
              const parsed = await simpleParser(raw)

              const messageId = parsed.messageId || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

              // Check if already exists in Supabase
              const { data: existing } = await supabase
                .from('emails')
                .select('id')
                .eq('messageId', messageId)
                .maybeSingle()

              if (existing) continue

              const fromAddr = parsed.from?.value?.[0]?.address || 'desconhecido'
              const fromName = parsed.from?.value?.[0]?.name || fromAddr
              const to = parsed.to?.value?.[0]?.address || ''
              const subject = parsed.subject || '(Sem assunto)'
              const body = parsed.text || ''
              const bodyHtml = typeof parsed.html === 'string' ? parsed.html : ''
              const date = parsed.date?.toISOString() || new Date().toISOString()

              const { error } = await supabase.from('emails').insert({
                messageId,
                from: fromAddr,
                fromName,
                to,
                subject,
                body,
                bodyHtml,
                date,
                folder,
                read: false,
              })

              if (error) {
                console.error('[IMAP] Erro ao inserir:', error.message)
                continue
              }

              synced++
              console.log(`[IMAP] + ${subject.slice(0, 60)}`)
            } catch (parseErr) {
              console.error('[IMAP] Erro ao parsear e-mail:', parseErr.message)
            }
          }

          imap.end()
          console.log(`[IMAP] Sincronização concluída: ${synced} novos de ${rawEmails.length} total`)
          resolve({ synced, total: rawEmails.length })
        })
      })
    })

    imap.once('error', (err) => {
      console.error('[IMAP] Erro de conexão:', err.message)
      reject(new Error(`Falha IMAP: ${err.message}`))
    })

    imap.once('end', () => {
      console.log('[IMAP] Conexão encerrada')
    })

    imap.connect()
  })
}
