-- ==========================================
-- Mooze Suporte - Supabase Schema
-- Execute no Supabase SQL Editor
-- ==========================================

-- Tabela: emails
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "messageId" TEXT UNIQUE,
  "from" TEXT,
  "fromName" TEXT,
  "to" TEXT,
  subject TEXT,
  body TEXT,
  "bodyHtml" TEXT,
  date TIMESTAMPTZ,
  folder TEXT DEFAULT 'INBOX',
  read BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'novo',
  category TEXT,
  urgency TEXT,
  risk TEXT,
  "suggestedResponse" TEXT,
  "internalAction" TEXT,
  "isRecurrent" BOOLEAN DEFAULT false,
  "recurrentPattern" TEXT,
  "operatorNotes" TEXT,
  "respondedAt" TIMESTAMPTZ,
  "respondedBy" TEXT,
  tags TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_emails_date ON emails(date);
CREATE INDEX idx_emails_status ON emails(status);
CREATE INDEX idx_emails_category ON emails(category);
CREATE INDEX idx_emails_urgency ON emails(urgency);
CREATE INDEX idx_emails_message_id ON emails("messageId");

-- Tabela: templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  content TEXT NOT NULL,
  "usageCount" INTEGER DEFAULT 0,
  "approvalRate" REAL DEFAULT 1.0,
  "lastUsed" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Tabela: responses
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "emailId" UUID REFERENCES emails(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_responses_email_id ON responses("emailId");
CREATE INDEX idx_responses_created_at ON responses("createdAt");

-- Tabela: patterns
CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  category TEXT,
  count INTEGER DEFAULT 1,
  "firstSeen" TIMESTAMPTZ,
  "lastSeen" TIMESTAMPTZ,
  severity TEXT DEFAULT 'info',
  description TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- Trigger: auto-update updatedAt
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emails_updated_at
  BEFORE UPDATE ON emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- RLS: Authenticated users can do everything
-- ==========================================

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_emails" ON emails FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_templates" ON templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_responses" ON responses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_patterns" ON patterns FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role (sync worker) bypasses RLS automatically

-- ==========================================
-- RPC: Dashboard Stats
-- ==========================================

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalEmails', (SELECT COUNT(*) FROM emails),
    'unread', (SELECT COUNT(*) FROM emails WHERE read = false),
    'critical', (SELECT COUNT(*) FROM emails WHERE urgency = 'critica'),
    'pendingResponse', (SELECT COUNT(*) FROM emails WHERE status IN ('novo', 'em_analise')),
    'resolvedToday', (SELECT COUNT(*) FROM emails WHERE status = 'resolvido' AND "respondedAt"::date = CURRENT_DATE),
    'avgResponseTime', '--',
    'topCategories', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT category, COUNT(*) as count
        FROM emails WHERE category IS NOT NULL
        GROUP BY category ORDER BY count DESC LIMIT 6
      ) t
    ), '[]'::json),
    'urgencyDistribution', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT urgency as level, COUNT(*) as count
        FROM emails WHERE urgency IS NOT NULL
        GROUP BY urgency
      ) t
    ), '[]'::json),
    'riskAlerts', (SELECT COUNT(*) FROM emails WHERE risk IN ('juridico', 'reputacional')),
    'recurrentIssues', (SELECT COUNT(*) FROM emails WHERE "isRecurrent" = true)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- RPC: Pattern Detection
-- ==========================================

CREATE OR REPLACE FUNCTION get_patterns()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT
      'spike-' || category as id,
      'Pico: ' || category as pattern,
      category,
      count,
      now() as "firstSeen",
      now() as "lastSeen",
      CASE
        WHEN count >= 8 THEN 'critical'
        WHEN count >= 5 THEN 'warning'
        ELSE 'info'
      END as severity,
      count || ' e-mails na categoria "' || category || '" nas ultimas 24h' as description
    FROM (
      SELECT category, COUNT(*) as count
      FROM emails
      WHERE date >= now() - interval '1 day' AND category IS NOT NULL
      GROUP BY category
      HAVING COUNT(*) >= 3
      ORDER BY count DESC
    ) spikes

    UNION ALL

    SELECT
      'risk-alert' as id,
      'Alertas de Risco' as pattern,
      'seguranca' as category,
      risk_count as count,
      now() as "firstSeen",
      now() as "lastSeen",
      'critical' as severity,
      risk_count || ' e-mail(s) com risco juridico ou reputacional nos ultimos 7 dias' as description
    FROM (
      SELECT COUNT(*) as risk_count
      FROM emails
      WHERE risk IN ('juridico', 'reputacional') AND date >= now() - interval '7 days'
    ) risks
    WHERE risk_count > 0
  ) t
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- RPC: Learned Response for a category
-- ==========================================

-- ==========================================
-- Tabela: chat_messages (Agent Chat History)
-- ==========================================

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'agent')),
  content TEXT NOT NULL,
  action TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_user_id ON chat_messages("userId");
CREATE INDEX idx_chat_messages_created_at ON chat_messages("createdAt");

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_chat" ON chat_messages
  FOR ALL TO authenticated
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

-- ==========================================
-- RPC: Learned Response for a category
-- ==========================================

CREATE OR REPLACE FUNCTION get_learned_response(cat TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT row_to_json(t) INTO result
  FROM (
    SELECT r.content as response, r."createdAt" as "learnedAt"
    FROM responses r
    JOIN emails e ON e.id = r."emailId"
    WHERE e.category = cat
      AND r."createdAt" >= now() - interval '30 days'
      AND length(r.content) > 50
    ORDER BY r."createdAt" DESC
    LIMIT 1
  ) t;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- RPC: Recurrence check for a category
-- ==========================================

CREATE OR REPLACE FUNCTION check_recurrence(cat TEXT, email_id UUID)
RETURNS INTEGER AS $$
DECLARE
  similar_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO similar_count
  FROM emails
  WHERE category = cat AND id != email_id;
  RETURN similar_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Tabela: knowledge_base (Cérebro do Agente IA)
-- ==========================================

CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_knowledge_base" ON knowledge_base
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE TRIGGER knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
