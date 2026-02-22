/**
 * Parses an email body to separate the latest message from the quoted thread history.
 * Handles common patterns from Outlook, Gmail, and other email clients.
 */

export interface ThreadMessage {
  content: string
  from?: string
  date?: string
  isLatest: boolean
}

// Patterns that indicate the start of a quoted reply
const QUOTE_SEPARATORS = [
  // Portuguese: "Em DD/MM/YYYY HH:MM, Name escreveu:"
  /^Em \d{1,2}\/\d{1,2}\/\d{2,4}[\s,]+\d{1,2}:\d{2}.*(?:escreveu|wrote):\s*$/im,
  // English: "On Date, Name wrote:"
  /^On .+(?:wrote|escreveu):\s*$/im,
  // Outlook separator line
  /^_{5,}\s*$/m,
  /^-{5,}\s*$/m,
  // Outlook header block: "From: ... Sent: ... To: ... Subject: ..."
  /^From:\s*.+\nSent:\s*.+\nTo:\s*.+\nSubject:\s*.+$/im,
  // Gmail style: "---------- Forwarded message ----------"
  /^-{5,}\s*(?:Forwarded|Mensagem encaminhada).*-{5,}\s*$/im,
]

// Patterns that indicate app signatures before quoted content
const PRE_QUOTE_SIGNATURES = [
  /^Obter o Outlook para (?:Android|iOS|Windows|Mac).*$/im,
  /^Sent from (?:my iPhone|my iPad|Mail for Windows).*$/im,
  /^Enviado do meu (?:iPhone|iPad|Android).*$/im,
  /^Get Outlook for (?:Android|iOS|Windows|Mac).*$/im,
]

export function parseEmailThread(body: string): ThreadMessage[] {
  if (!body) return [{ content: '', isLatest: true }]

  const lines = body.split('\n')
  const messages: ThreadMessage[] = []

  let currentStart = 0
  let separatorIndices: { index: number; from?: string; date?: string }[] = []

  // Find all separator positions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const nextLines = lines.slice(i, i + 5).join('\n')

    // Check for quote separators
    for (const pattern of QUOTE_SEPARATORS) {
      if (pattern.test(line) || pattern.test(nextLines)) {
        // Try to extract "from" and "date" from context
        let from: string | undefined
        let date: string | undefined

        // "Em DD/MM/YYYY HH:MM, Name escreveu:"
        const ptMatch = line.match(/^Em (\d{1,2}\/\d{1,2}\/\d{2,4}[\s,]+\d{1,2}:\d{2}),?\s*(.+?)(?:\s+escreveu|\s+wrote):/i)
        if (ptMatch) {
          date = ptMatch[1]
          from = ptMatch[2]
        }

        // Outlook "From: X ... Sent: Y ..."
        const outlookBlock = nextLines.match(/From:\s*(.+?)[\n<].*?Sent:\s*(.+?)\n/is)
        if (outlookBlock) {
          from = outlookBlock[1].trim().replace(/<.*>/, '').trim()
          date = outlookBlock[2].trim()
        }

        // Check for pre-quote signature (e.g. "Obter o Outlook para Android") 1-3 lines before
        let adjustedIndex = i
        for (let back = 1; back <= 3 && i - back >= 0; back++) {
          for (const sigPattern of PRE_QUOTE_SIGNATURES) {
            if (sigPattern.test(lines[i - back])) {
              adjustedIndex = i - back
              break
            }
          }
          if (adjustedIndex !== i) break
        }

        separatorIndices.push({ index: adjustedIndex, from, date })
        break
      }
    }

    // Also check pre-quote signatures as standalone separators
    if (separatorIndices.length === 0 || separatorIndices[separatorIndices.length - 1].index !== i) {
      for (const sigPattern of PRE_QUOTE_SIGNATURES) {
        if (sigPattern.test(line)) {
          // Only use as separator if followed by quoted content (From: ... or "Em ... escreveu:")
          const remaining = lines.slice(i + 1, i + 6).join('\n')
          const hasQuotedContent = QUOTE_SEPARATORS.some((p) => p.test(remaining))
          if (hasQuotedContent) {
            separatorIndices.push({ index: i })
            break
          }
        }
      }
    }
  }

  // Deduplicate separators that are too close together
  separatorIndices = separatorIndices.filter((sep, idx) => {
    if (idx === 0) return true
    return sep.index - separatorIndices[idx - 1].index > 2
  })

  if (separatorIndices.length === 0) {
    // No thread detected — single message
    return [{ content: body.trim(), isLatest: true }]
  }

  // Extract the latest message (before first separator)
  const latestContent = lines.slice(0, separatorIndices[0].index).join('\n').trim()
  if (latestContent) {
    messages.push({ content: latestContent, isLatest: true })
  }

  // Extract each quoted message
  for (let i = 0; i < separatorIndices.length; i++) {
    const start = separatorIndices[i].index
    const end = i + 1 < separatorIndices.length ? separatorIndices[i + 1].index : lines.length
    const content = lines.slice(start, end).join('\n').trim()

    if (content) {
      messages.push({
        content,
        from: separatorIndices[i].from,
        date: separatorIndices[i].date,
        isLatest: false,
      })
    }
  }

  // If first message is empty, mark the second as latest
  if (messages.length > 0 && !messages[0].content) {
    messages.shift()
    if (messages.length > 0) messages[0].isLatest = true
  }

  return messages.length > 0 ? messages : [{ content: body.trim(), isLatest: true }]
}
