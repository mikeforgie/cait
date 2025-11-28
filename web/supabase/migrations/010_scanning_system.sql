-- SEO Scanning + Auto-Complete System
-- Tracks technical SEO scans and automatically completes todos based on scan results

-- Table: seo_scans
-- Tracks scanning sessions with progress and results
CREATE TABLE IF NOT EXISTS seo_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  scan_type TEXT NOT NULL DEFAULT 'full', -- 'full', 'quick', 'specific'
  scan_status TEXT NOT NULL DEFAULT 'running' CHECK (scan_status IN (
    'running',
    'completed',
    'failed',
    'partial'
  )),

  -- Scan coverage
  pages_scanned INTEGER DEFAULT 0,
  total_pages_found INTEGER DEFAULT 0,

  -- Issue counts
  critical_issues INTEGER DEFAULT 0,
  warnings INTEGER DEFAULT 0,
  recommendations INTEGER DEFAULT 0,

  -- Scan results summary
  scan_results JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,

  -- Timing
  duration_seconds INTEGER,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  -- Metadata
  triggered_by TEXT DEFAULT 'manual', -- 'manual', 'scheduled', 'onboarding'
  scan_config JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_seo_scans_client ON seo_scans(client_id);
CREATE INDEX idx_seo_scans_status ON seo_scans(scan_status);
CREATE INDEX idx_seo_scans_started ON seo_scans(started_at DESC);

-- Table: seo_issues
-- Individual SEO issues detected during scans
CREATE TABLE IF NOT EXISTS seo_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES seo_scans(id) ON DELETE CASCADE,

  -- Issue classification
  issue_type TEXT NOT NULL CHECK (issue_type IN (
    'no_ssl',
    'missing_sitemap',
    'invalid_sitemap',
    'missing_robots_txt',
    'missing_meta_description',
    'duplicate_meta_description',
    'missing_alt_text',
    'broken_link',
    'slow_page_speed',
    'not_mobile_friendly',
    'missing_h1',
    'duplicate_h1',
    'thin_content',
    'broken_image',
    'redirect_chain',
    'missing_canonical',
    'duplicate_content'
  )),

  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN (
    'critical',
    'warning',
    'recommendation'
  )),

  -- Issue details
  title TEXT NOT NULL,
  description TEXT,
  affected_url TEXT,
  affected_element TEXT, -- CSS selector or element identifier

  -- Fix information
  fix_suggestion TEXT,
  fix_complexity TEXT DEFAULT 'medium' CHECK (fix_complexity IN (
    'easy',
    'medium',
    'hard'
  )),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',
    'resolved',
    'false_positive',
    'ignored'
  )),

  resolved_at TIMESTAMP,
  resolved_by TEXT, -- 'auto_scan', 'manual', 'ai_assistant'

  -- Metadata
  issue_data JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_seo_issues_client ON seo_issues(client_id);
CREATE INDEX idx_seo_issues_scan ON seo_issues(scan_id);
CREATE INDEX idx_seo_issues_type ON seo_issues(issue_type);
CREATE INDEX idx_seo_issues_status ON seo_issues(status);
CREATE INDEX idx_seo_issues_severity ON seo_issues(severity);

-- Table: seo_todos
-- SEO tasks that can be auto-completed based on scan results
CREATE TABLE IF NOT EXISTS seo_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Todo details
  todo_type TEXT NOT NULL CHECK (todo_type IN (
    'implement_ssl',
    'create_sitemap',
    'create_robots_txt',
    'add_meta_descriptions',
    'add_alt_text',
    'fix_broken_links',
    'improve_page_speed',
    'mobile_optimization',
    'add_h1_tags',
    'fix_thin_content',
    'implement_schema',
    'fix_canonicals'
  )),

  title TEXT NOT NULL,
  description TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_progress',
    'completed',
    'skipped'
  )),

  priority TEXT DEFAULT 'medium' CHECK (priority IN (
    'critical',
    'high',
    'medium',
    'low'
  )),

  -- Auto-completion tracking
  auto_completable BOOLEAN DEFAULT true,
  completion_method TEXT, -- 'auto_detected', 'manual', 'ai_assisted'

  -- Linked data
  related_issue_type TEXT, -- Maps to seo_issues.issue_type
  related_scan_id UUID REFERENCES seo_scans(id),

  -- Counts (for batch todos like "Add 47 missing meta descriptions")
  total_items INTEGER DEFAULT 1,
  completed_items INTEGER DEFAULT 0,

  -- Completion tracking
  completed_at TIMESTAMP,
  auto_completed BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_seo_todos_client ON seo_todos(client_id);
CREATE INDEX idx_seo_todos_status ON seo_todos(status);
CREATE INDEX idx_seo_todos_type ON seo_todos(todo_type);
CREATE INDEX idx_seo_todos_priority ON seo_todos(priority);

-- Table: scan_schedules
-- Configure automatic scanning schedules
CREATE TABLE IF NOT EXISTS scan_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  schedule_type TEXT NOT NULL DEFAULT 'daily' CHECK (schedule_type IN (
    'daily',
    'weekly',
    'biweekly',
    'monthly'
  )),

  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,

  scan_config JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id) -- One schedule per client
);

CREATE INDEX idx_scan_schedules_next_run ON scan_schedules(next_run_at) WHERE is_active = true;

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_seo_issues_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seo_issues_update_timestamp
  BEFORE UPDATE ON seo_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_issues_timestamp();

CREATE OR REPLACE FUNCTION update_seo_todos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seo_todos_update_timestamp
  BEFORE UPDATE ON seo_todos
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_todos_timestamp();

-- Trigger: Auto-create todos from scan results
CREATE OR REPLACE FUNCTION auto_create_todos_from_scan()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when scan completes
  IF NEW.scan_status = 'completed' AND OLD.scan_status != 'completed' THEN

    -- Check for SSL issues
    IF (NEW.scan_results->>'has_ssl')::boolean = false THEN
      INSERT INTO seo_todos (client_id, todo_type, title, description, priority, related_scan_id, related_issue_type, auto_completable)
      VALUES (
        NEW.client_id,
        'implement_ssl',
        'Implement SSL/HTTPS',
        'Your website is not using HTTPS. This is critical for security and SEO.',
        'critical',
        NEW.id,
        'no_ssl',
        true
      )
      ON CONFLICT DO NOTHING;
    END IF;

    -- Check for sitemap
    IF (NEW.scan_results->>'has_sitemap')::boolean = false THEN
      INSERT INTO seo_todos (client_id, todo_type, title, description, priority, related_scan_id, related_issue_type, auto_completable)
      VALUES (
        NEW.client_id,
        'create_sitemap',
        'Create XML Sitemap',
        'Your website is missing an XML sitemap. This helps search engines discover your content.',
        'high',
        NEW.id,
        'missing_sitemap',
        true
      )
      ON CONFLICT DO NOTHING;
    END IF;

    -- Check for robots.txt
    IF (NEW.scan_results->>'has_robots_txt')::boolean = false THEN
      INSERT INTO seo_todos (client_id, todo_type, title, description, priority, related_scan_id, related_issue_type, auto_completable)
      VALUES (
        NEW.client_id,
        'create_robots_txt',
        'Create robots.txt',
        'Your website is missing a robots.txt file.',
        'medium',
        NEW.id,
        'missing_robots_txt',
        true
      )
      ON CONFLICT DO NOTHING;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_todos
  AFTER UPDATE ON seo_scans
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_todos_from_scan();

-- Comments for documentation
COMMENT ON TABLE seo_scans IS 'Tracks technical SEO scanning sessions with progress and results';
COMMENT ON TABLE seo_issues IS 'Individual SEO issues detected during scans';
COMMENT ON TABLE seo_todos IS 'SEO tasks that can be auto-completed based on scan results';
COMMENT ON TABLE scan_schedules IS 'Automatic scanning schedules per client';
