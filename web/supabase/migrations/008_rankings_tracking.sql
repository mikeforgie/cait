-- Rankings Tracking System
-- Migration: 008_rankings_tracking
-- Created: 2025-01-XX
-- Description: Track keyword rankings over time for attribution analysis

-- Table: keyword_rankings
-- Daily/weekly keyword position tracking
CREATE TABLE IF NOT EXISTS keyword_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Keyword and target page
  keyword TEXT NOT NULL,
  target_url TEXT, -- The page ranking for this keyword (if specific)

  -- Position data
  position INTEGER NOT NULL CHECK (position >= 0),
  previous_position INTEGER,
  position_change INTEGER, -- Positive = improved, negative = dropped

  -- Search engine
  search_engine TEXT DEFAULT 'google' CHECK (search_engine IN ('google', 'bing', 'chatgpt', 'perplexity', 'claude', 'gemini')),
  search_location TEXT DEFAULT 'us', -- Country/region code
  device_type TEXT DEFAULT 'desktop' CHECK (device_type IN ('desktop', 'mobile')),

  -- Metrics
  search_volume INTEGER, -- Monthly search volume
  click_through_rate DECIMAL(5,2), -- CTR percentage
  impressions INTEGER,
  clicks INTEGER,

  -- Timestamps
  measured_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for keyword_rankings
CREATE INDEX idx_rankings_client_keyword ON keyword_rankings(client_id, keyword, measured_at DESC);
CREATE INDEX idx_rankings_client_time ON keyword_rankings(client_id, measured_at DESC);
CREATE INDEX idx_rankings_target_url ON keyword_rankings(target_url);
CREATE INDEX idx_rankings_keyword ON keyword_rankings(keyword);
CREATE INDEX idx_rankings_position ON keyword_rankings(position);

-- Table: tracked_keywords
-- Keywords the user wants to monitor
CREATE TABLE IF NOT EXISTS tracked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Keyword details
  keyword TEXT NOT NULL,
  target_url TEXT, -- The page they want to rank for this keyword

  -- Tracking settings
  search_engine TEXT DEFAULT 'google',
  search_location TEXT DEFAULT 'us',
  device_type TEXT DEFAULT 'desktop',

  -- Priority
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Baseline data
  initial_position INTEGER,
  best_position INTEGER,
  worst_position INTEGER,
  current_position INTEGER,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_checked_at TIMESTAMP,

  -- Prevent duplicate keywords per client
  UNIQUE(client_id, keyword, search_engine, device_type)
);

-- Indexes for tracked_keywords
CREATE INDEX idx_tracked_keywords_client ON tracked_keywords(client_id, is_active);
CREATE INDEX idx_tracked_keywords_priority ON tracked_keywords(priority, is_active);

-- Table: backlink_tracking
-- Track backlinks and their status
CREATE TABLE IF NOT EXISTS backlink_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Backlink details
  source_url TEXT NOT NULL, -- Where the link is from
  source_domain TEXT NOT NULL, -- Domain only
  target_url TEXT NOT NULL, -- Our page being linked to

  -- Link quality
  anchor_text TEXT,
  link_type TEXT CHECK (link_type IN ('dofollow', 'nofollow', 'ugc', 'sponsored')),
  domain_authority INTEGER,
  page_authority INTEGER,

  -- Status
  is_indexed BOOLEAN DEFAULT false, -- Is the source page indexed?
  is_live BOOLEAN DEFAULT true, -- Is the link still there?
  last_checked_at TIMESTAMP,

  -- Acquisition details
  acquisition_method TEXT, -- 'outreach', 'guest_post', 'manual', 'organic'
  acquisition_cost DECIMAL(10,2),
  related_action_id UUID REFERENCES seo_actions(id), -- Link to the action that got this backlink

  -- Timestamps
  discovered_at TIMESTAMP DEFAULT NOW(),
  first_indexed_at TIMESTAMP,
  lost_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for backlink_tracking
CREATE INDEX idx_backlinks_client ON backlink_tracking(client_id, is_live);
CREATE INDEX idx_backlinks_target ON backlink_tracking(target_url);
CREATE INDEX idx_backlinks_source ON backlink_tracking(source_domain);
CREATE INDEX idx_backlinks_action ON backlink_tracking(related_action_id);
CREATE INDEX idx_backlinks_indexed ON backlink_tracking(is_indexed, is_live);

-- Function: Update tracked_keywords updated_at timestamp
CREATE OR REPLACE FUNCTION update_tracked_keywords_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update timestamp on tracked_keywords changes
CREATE TRIGGER trigger_update_tracked_keywords_timestamp
  BEFORE UPDATE ON tracked_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_tracked_keywords_timestamp();

-- Function: Auto-update tracked_keywords current_position from latest ranking
CREATE OR REPLACE FUNCTION update_current_position()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the tracked keyword's current position, best, and worst
  UPDATE tracked_keywords
  SET
    current_position = NEW.position,
    best_position = LEAST(COALESCE(best_position, NEW.position), NEW.position),
    worst_position = GREATEST(COALESCE(worst_position, NEW.position), NEW.position),
    last_checked_at = NEW.measured_at
  WHERE
    client_id = NEW.client_id
    AND keyword = NEW.keyword
    AND search_engine = NEW.search_engine
    AND device_type = NEW.device_type;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update tracked keyword when new ranking is recorded
CREATE TRIGGER trigger_update_current_position
  AFTER INSERT ON keyword_rankings
  FOR EACH ROW
  EXECUTE FUNCTION update_current_position();

-- Comments
COMMENT ON TABLE keyword_rankings IS 'Historical keyword position data for attribution analysis';
COMMENT ON TABLE tracked_keywords IS 'Keywords the user is actively monitoring';
COMMENT ON TABLE backlink_tracking IS 'Backlinks and their status for attribution';
COMMENT ON COLUMN keyword_rankings.position_change IS 'Change from previous check (positive = improved rank)';
COMMENT ON COLUMN backlink_tracking.is_indexed IS 'Whether Google has indexed the page containing the backlink';
