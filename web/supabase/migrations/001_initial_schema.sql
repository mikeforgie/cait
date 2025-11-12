-- CAIT Database Schema
-- Core tables for SEO automation platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,

  -- Google Integration
  ga4_property_id TEXT,
  gsc_url TEXT,
  gtm_container_id TEXT,

  -- Business Info
  focus_service TEXT,
  primary_location TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  onboarding_completed BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table (based on Month 0-12 automation roadmap)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Task Info
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 12),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'keyword_research',
    'content',
    'technical_seo',
    'backlinks',
    'local_seo',
    'analytics'
  )),

  -- Automation
  automated BOOLEAN DEFAULT FALSE,
  automation_config JSONB,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_progress',
    'completed',
    'blocked'
  )),
  completed_at TIMESTAMPTZ,

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics table (daily/weekly aggregations)
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Time period
  date DATE NOT NULL,
  period_type TEXT DEFAULT 'daily' CHECK (period_type IN ('daily', 'weekly', 'monthly')),

  -- Traffic Metrics
  traffic INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2),
  avg_session_duration INTEGER,

  -- SEO Metrics
  ranking_avg DECIMAL(5,2),
  top_10_keywords INTEGER DEFAULT 0,
  total_keywords INTEGER DEFAULT 0,

  -- Backlink Metrics
  backlinks_count INTEGER DEFAULT 0,
  referring_domains INTEGER DEFAULT 0,
  domain_rating INTEGER,

  -- Local SEO
  gbp_views INTEGER DEFAULT 0,
  gbp_actions INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, date, period_type)
);

-- Keywords table
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Keyword Info
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  difficulty INTEGER,
  cpc DECIMAL(10,2),

  -- Tracking
  current_position INTEGER,
  best_position INTEGER,
  target_url TEXT,

  -- Classification
  intent TEXT CHECK (intent IN ('informational', 'commercial', 'transactional', 'navigational')),
  category TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

  -- Metadata
  first_tracked TIMESTAMPTZ DEFAULT NOW(),
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content table
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Content Info
  title TEXT NOT NULL,
  url TEXT,
  type TEXT CHECK (type IN ('blog', 'page', 'service', 'location')),

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',
    'in_review',
    'published',
    'updated'
  )),

  -- SEO Data
  target_keyword TEXT,
  word_count INTEGER,
  readability_score DECIMAL(5,2),

  -- AI Generation
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,

  -- Publishing
  published_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backlinks table
CREATE TABLE backlinks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Backlink Info
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,

  -- Metrics
  source_domain_rating INTEGER,
  link_type TEXT CHECK (link_type IN ('dofollow', 'nofollow', 'ugc', 'sponsored')),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'lost', 'broken')),

  -- Discovery
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  lost_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Report Info
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  report_type TEXT DEFAULT 'monthly' CHECK (report_type IN ('monthly', 'quarterly', 'custom')),

  -- Content
  pdf_url TEXT,
  report_data JSONB,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent')),
  sent_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, month, year, report_type)
);

-- Client interviews table (for AI questionnaire system)
CREATE TABLE client_interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Interview Info
  interview_type TEXT CHECK (interview_type IN ('onboarding', 'monthly', 'quarterly')),

  -- Questions & Answers
  questions JSONB NOT NULL,
  responses JSONB,
  ai_analysis JSONB,

  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'completed', 'analyzed')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_month ON tasks(month);
CREATE INDEX idx_metrics_client_date ON metrics(client_id, date);
CREATE INDEX idx_keywords_client_id ON keywords(client_id);
CREATE INDEX idx_content_client_id ON content(client_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_backlinks_client_id ON backlinks(client_id);
CREATE INDEX idx_backlinks_status ON backlinks(status);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrics_updated_at BEFORE UPDATE ON metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backlinks_updated_at BEFORE UPDATE ON backlinks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_interviews ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY "Allow authenticated read" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON keywords FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON content FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON backlinks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON client_interviews FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update/delete (can be refined later)
CREATE POLICY "Allow authenticated write" ON clients FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON tasks FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON metrics FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON keywords FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON content FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON backlinks FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON reports FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON client_interviews FOR ALL TO authenticated USING (true);
