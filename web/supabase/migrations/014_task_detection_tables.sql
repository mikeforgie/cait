-- Migration 014: Task Detection Support Tables
-- Description: Add tables required by the task-completion-detector system
-- These tables store SEO research data, content planning, and automation configuration

-- ============================================
-- Table: keyword_research
-- Stores keyword research data from DataForSEO or manual entry
-- ============================================
CREATE TABLE IF NOT EXISTS keyword_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Keyword data
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  competition DECIMAL(5,4) DEFAULT 0, -- 0.0000 to 1.0000
  difficulty INTEGER, -- 0-100 scale

  -- Classification
  intent TEXT CHECK (intent IN ('informational', 'transactional', 'navigational', 'commercial')),
  category TEXT, -- User-defined category
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),

  -- Tracking
  is_target BOOLEAN DEFAULT false, -- Is this a target keyword?
  target_url TEXT, -- Which page should rank for this?

  -- Source
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'dataforseo', 'gsc', 'import')),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id, keyword)
);

CREATE INDEX idx_keyword_research_client ON keyword_research(client_id);
CREATE INDEX idx_keyword_research_volume ON keyword_research(search_volume DESC);
CREATE INDEX idx_keyword_research_target ON keyword_research(client_id, is_target) WHERE is_target = true;

-- ============================================
-- Table: competitors
-- Stores competitor analysis data
-- ============================================
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Competitor info
  domain TEXT NOT NULL,
  name TEXT, -- Company name

  -- Metrics (from DataForSEO or other sources)
  domain_rank INTEGER,
  organic_traffic INTEGER,
  organic_keywords INTEGER,
  backlinks_count INTEGER,
  referring_domains INTEGER,

  -- Classification
  competitor_type TEXT DEFAULT 'direct' CHECK (competitor_type IN ('direct', 'indirect', 'aspirational')),
  priority INTEGER DEFAULT 1, -- 1 = primary, 2 = secondary, etc.

  -- Analysis status
  last_analyzed_at TIMESTAMP,
  analysis_data JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id, domain)
);

CREATE INDEX idx_competitors_client ON competitors(client_id);
CREATE INDEX idx_competitors_priority ON competitors(client_id, priority);

-- ============================================
-- Table: referring_domains
-- Aggregated referring domain data for backlink tracking
-- ============================================
CREATE TABLE IF NOT EXISTS referring_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Domain info
  domain TEXT NOT NULL,

  -- Metrics
  domain_rank INTEGER, -- DR/DA
  backlinks_count INTEGER DEFAULT 1,
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'lost')),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id, domain)
);

CREATE INDEX idx_referring_domains_client ON referring_domains(client_id);
CREATE INDEX idx_referring_domains_rank ON referring_domains(domain_rank DESC);

-- ============================================
-- Table: content_calendar
-- Content planning and scheduling
-- ============================================
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Content details
  title TEXT NOT NULL,
  content_type TEXT DEFAULT 'blog_post' CHECK (content_type IN (
    'blog_post', 'landing_page', 'service_page', 'location_page',
    'case_study', 'guide', 'infographic', 'video', 'other'
  )),

  -- SEO targeting
  target_keyword TEXT,
  secondary_keywords TEXT[], -- Array of secondary keywords
  target_url TEXT, -- Where it will be published

  -- Planning
  status TEXT DEFAULT 'planned' CHECK (status IN (
    'idea', 'planned', 'in_progress', 'review', 'approved', 'published', 'cancelled'
  )),
  scheduled_date DATE,
  assigned_to TEXT,

  -- Content brief
  brief TEXT,
  word_count_target INTEGER,
  outline JSONB, -- Structured outline

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_calendar_client ON content_calendar(client_id);
CREATE INDEX idx_content_calendar_status ON content_calendar(status);
CREATE INDEX idx_content_calendar_scheduled ON content_calendar(scheduled_date);

-- ============================================
-- Table: content_published
-- Tracks published content for attribution
-- ============================================
CREATE TABLE IF NOT EXISTS content_published (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Content details
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  content_type TEXT DEFAULT 'blog_post',

  -- SEO data
  target_keyword TEXT,
  word_count INTEGER,

  -- Publishing
  published_at TIMESTAMP NOT NULL DEFAULT NOW(),
  author TEXT,

  -- Performance (updated periodically)
  pageviews INTEGER DEFAULT 0,
  organic_traffic INTEGER DEFAULT 0,
  avg_position DECIMAL(5,2),

  -- Links to other records
  calendar_id UUID REFERENCES content_calendar(id),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_published_client ON content_published(client_id);
CREATE INDEX idx_content_published_date ON content_published(published_at DESC);
CREATE INDEX idx_content_published_url ON content_published(url);

-- ============================================
-- Table: documents
-- Stores generated strategy documents, audits, etc.
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Document info
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'strategy', 'audit', 'report', 'proposal', 'sop', 'other'
  )),

  -- Content
  content TEXT, -- Markdown or HTML content
  file_url TEXT, -- Link to Google Doc, PDF, etc.

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'archived')),
  version INTEGER DEFAULT 1,

  -- Metadata
  created_by TEXT DEFAULT 'ai',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_client ON documents(client_id);
CREATE INDEX idx_documents_type ON documents(type);

-- ============================================
-- Table: brightlocal_locations
-- BrightLocal integration for local SEO
-- ============================================
CREATE TABLE IF NOT EXISTS brightlocal_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- BrightLocal IDs
  brightlocal_location_id TEXT NOT NULL,
  brightlocal_campaign_id TEXT,

  -- Location info
  business_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
  last_synced_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id, brightlocal_location_id)
);

CREATE INDEX idx_brightlocal_locations_client ON brightlocal_locations(client_id);

-- ============================================
-- Table: domain_metrics
-- Stores domain-level metrics from DataForSEO
-- ============================================
CREATE TABLE IF NOT EXISTS domain_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID UNIQUE NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Domain overview
  domain_rank INTEGER,
  organic_traffic INTEGER,
  organic_keywords INTEGER,

  -- Backlink metrics
  backlinks_count INTEGER,
  referring_domains INTEGER,

  -- Trust/Authority
  trust_rank INTEGER,

  -- Trends (month-over-month)
  traffic_trend DECIMAL(5,2), -- Percentage change
  keyword_trend DECIMAL(5,2),

  -- Last update
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Table: automation_config
-- Stores configuration for various automations
-- ============================================
CREATE TABLE IF NOT EXISTS automation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Config type
  type TEXT NOT NULL CHECK (type IN (
    'backlink_monitoring', 'rank_tracking', 'content_alerts',
    'report_schedule', 'scan_schedule', 'strategy_document', 'other'
  )),

  -- Configuration
  config JSONB NOT NULL DEFAULT '{}',
  /* Example configs:
  backlink_monitoring: {
    "enabled": true,
    "alert_on_lost": true,
    "alert_on_new": false,
    "min_dr": 20
  }
  rank_tracking: {
    "enabled": true,
    "keywords": ["seo", "digital marketing"],
    "frequency": "daily",
    "locations": ["us"]
  }
  */

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id, type)
);

CREATE INDEX idx_automation_config_client ON automation_config(client_id);
CREATE INDEX idx_automation_config_type ON automation_config(type);

-- ============================================
-- Table: scan_logs
-- Logs for all scanner runs (connection, DataForSEO, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Scan info
  scan_type TEXT NOT NULL, -- 'connection_scan', 'keyword_research', 'backlink_discovery', etc.
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),

  -- Configuration used
  config JSONB DEFAULT '{}',

  -- Results
  results JSONB DEFAULT '{}',
  error_message TEXT,

  -- Timing
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scan_logs_client ON scan_logs(client_id);
CREATE INDEX idx_scan_logs_type ON scan_logs(scan_type);
CREATE INDEX idx_scan_logs_status ON scan_logs(status);
CREATE INDEX idx_scan_logs_created ON scan_logs(created_at DESC);

-- ============================================
-- Table: rank_tracking
-- Custom keyword rank tracking configuration
-- ============================================
CREATE TABLE IF NOT EXISTS rank_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Keyword to track
  keyword TEXT NOT NULL,
  target_url TEXT, -- Optional: specific page to track

  -- Tracking config
  search_engine TEXT DEFAULT 'google' CHECK (search_engine IN ('google', 'bing', 'yahoo')),
  location TEXT DEFAULT 'United States',
  device TEXT DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile')),

  -- Current position (updated by rank checker)
  current_position INTEGER,
  previous_position INTEGER,
  best_position INTEGER,
  last_checked_at TIMESTAMP,

  -- Status
  active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id, keyword, search_engine, location, device)
);

CREATE INDEX idx_rank_tracking_client ON rank_tracking(client_id);
CREATE INDEX idx_rank_tracking_active ON rank_tracking(client_id, active) WHERE active = true;

-- ============================================
-- Add missing columns to existing tables
-- ============================================

-- Add delivered_at to reports table (detector uses this)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- Add domain_from_rank to backlinks for DR tracking
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS domain_from_rank INTEGER;

-- ============================================
-- Update triggers
-- ============================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to new tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'keyword_research', 'competitors', 'referring_domains',
    'content_calendar', 'content_published', 'documents',
    'brightlocal_locations', 'automation_config', 'rank_tracking'
  ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_modtime ON %s;
      CREATE TRIGGER update_%s_modtime
        BEFORE UPDATE ON %s
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    ', t, t, t, t);
  END LOOP;
END $$;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE keyword_research IS 'Stores keyword research data for SEO planning';
COMMENT ON TABLE competitors IS 'Tracks competitor domains and their metrics';
COMMENT ON TABLE referring_domains IS 'Aggregated referring domain data for backlink analysis';
COMMENT ON TABLE content_calendar IS 'Content planning and scheduling system';
COMMENT ON TABLE content_published IS 'Tracks published content for attribution';
COMMENT ON TABLE documents IS 'Stores strategy documents, audits, and reports';
COMMENT ON TABLE brightlocal_locations IS 'BrightLocal locations for local SEO tracking';
COMMENT ON TABLE domain_metrics IS 'Domain-level SEO metrics snapshot';
COMMENT ON TABLE automation_config IS 'Configuration for various automation features';
COMMENT ON TABLE scan_logs IS 'Logs for all scanner and automation runs';
COMMENT ON TABLE rank_tracking IS 'Custom keyword rank tracking configuration';
