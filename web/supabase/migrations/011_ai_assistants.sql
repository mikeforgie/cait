-- AI Assistant System
-- Stores AI-generated suggestions for SEO fixes that users can review and apply

-- Table: ai_suggestions
-- Stores AI-generated suggestions for bulk SEO fixes
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  todo_id UUID REFERENCES seo_todos(id) ON DELETE CASCADE,

  -- Suggestion details
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
    'meta_description',
    'alt_text',
    'h1_tag',
    'content_expansion',
    'link_replacement',
    'title_tag',
    'schema_markup'
  )),

  -- Target information
  target_url TEXT NOT NULL,
  target_element TEXT, -- CSS selector or element identifier

  -- AI-generated content
  suggested_content TEXT NOT NULL,
  original_content TEXT, -- What was there before (if any)

  -- Context used for generation
  context_data JSONB DEFAULT '{}'::jsonb, -- Page content, surrounding text, etc.

  -- Review and application
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',     -- Awaiting user review
    'approved',    -- User approved, ready to apply
    'applied',     -- Successfully applied
    'rejected',    -- User rejected
    'failed'       -- Application failed
  )),

  reviewed_at TIMESTAMP,
  applied_at TIMESTAMP,

  -- Quality metrics
  confidence_score DECIMAL(3,2), -- 0.0 to 1.0
  character_count INTEGER,

  -- Credits and tracking
  credits_used INTEGER DEFAULT 0,
  generation_time_ms INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_ai_suggestions_client;
DROP INDEX IF EXISTS idx_ai_suggestions_todo;
DROP INDEX IF EXISTS idx_ai_suggestions_type;
DROP INDEX IF EXISTS idx_ai_suggestions_status;
DROP INDEX IF EXISTS idx_ai_suggestions_url;

CREATE INDEX idx_ai_suggestions_client ON ai_suggestions(client_id);
CREATE INDEX idx_ai_suggestions_todo ON ai_suggestions(todo_id);
CREATE INDEX idx_ai_suggestions_type ON ai_suggestions(suggestion_type);
CREATE INDEX idx_ai_suggestions_status ON ai_suggestions(status);
CREATE INDEX idx_ai_suggestions_url ON ai_suggestions(target_url);

-- Table: ai_generation_jobs
-- Tracks bulk AI generation jobs (e.g., "Generate 47 meta descriptions")
CREATE TABLE IF NOT EXISTS ai_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  todo_id UUID REFERENCES seo_todos(id) ON DELETE CASCADE,

  job_type TEXT NOT NULL CHECK (job_type IN (
    'bulk_meta_descriptions',
    'bulk_alt_text',
    'bulk_h1_tags',
    'bulk_content_expansion',
    'bulk_link_fixes'
  )),

  -- Job progress
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN (
    'running',
    'completed',
    'failed',
    'cancelled'
  )),

  total_items INTEGER NOT NULL,
  completed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,

  -- Results
  suggestions_generated INTEGER DEFAULT 0,

  -- Credits and timing
  total_credits_used INTEGER DEFAULT 0,
  duration_seconds INTEGER,

  -- Error tracking
  error_message TEXT,

  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_ai_jobs_client;
DROP INDEX IF EXISTS idx_ai_jobs_todo;
DROP INDEX IF EXISTS idx_ai_jobs_status;

CREATE INDEX idx_ai_jobs_client ON ai_generation_jobs(client_id);
CREATE INDEX idx_ai_jobs_todo ON ai_generation_jobs(todo_id);
CREATE INDEX idx_ai_jobs_status ON ai_generation_jobs(status);

-- Table: page_content_cache
-- Caches page content to avoid re-fetching for AI generation
CREATE TABLE IF NOT EXISTS page_content_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  page_url TEXT NOT NULL,

  -- Cached content
  title TEXT,
  meta_description TEXT,
  h1_tags TEXT[],
  body_text TEXT,
  images JSONB DEFAULT '[]'::jsonb, -- [{ src, alt, context }]
  links JSONB DEFAULT '[]'::jsonb,  -- [{ href, text, context }]

  -- Page metadata
  word_count INTEGER,
  last_fetched_at TIMESTAMP DEFAULT NOW(),
  cache_expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id, page_url)
);

DROP INDEX IF EXISTS idx_page_cache_client;
DROP INDEX IF EXISTS idx_page_cache_url;
DROP INDEX IF EXISTS idx_page_cache_expires;

CREATE INDEX idx_page_cache_client ON page_content_cache(client_id);
CREATE INDEX idx_page_cache_url ON page_content_cache(page_url);
CREATE INDEX idx_page_cache_expires ON page_content_cache(cache_expires_at);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_ai_suggestions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_suggestions_update_timestamp ON ai_suggestions;
CREATE TRIGGER ai_suggestions_update_timestamp
  BEFORE UPDATE ON ai_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_suggestions_timestamp();

-- Trigger: Update todo progress when suggestions are applied
CREATE OR REPLACE FUNCTION update_todo_on_suggestion_applied()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when status changes to 'applied'
  IF NEW.status = 'applied' AND OLD.status != 'applied' THEN
    -- Increment completed_items in the related todo
    UPDATE seo_todos
    SET completed_items = COALESCE(completed_items, 0) + 1
    WHERE id = NEW.todo_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_todo_progress ON ai_suggestions;
CREATE TRIGGER update_todo_progress
  AFTER UPDATE ON ai_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_todo_on_suggestion_applied();

-- Comments for documentation
COMMENT ON TABLE ai_suggestions IS 'AI-generated suggestions for SEO fixes that users can review and apply';
COMMENT ON TABLE ai_generation_jobs IS 'Tracks bulk AI generation jobs with progress and status';
COMMENT ON TABLE page_content_cache IS 'Caches page content to avoid re-fetching during AI generation';
