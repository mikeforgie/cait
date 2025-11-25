-- Attribution System Tables
-- Migration: 007_attribution_system
-- Created: 2025-01-XX
-- Description: Track SEO actions and results for attribution analysis

-- Table: seo_actions
-- Stores every SEO action taken (content, meta updates, backlinks, etc.)
CREATE TABLE IF NOT EXISTS seo_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Action classification
  action_type TEXT NOT NULL,
  action_category TEXT NOT NULL CHECK (action_category IN ('on_page', 'content', 'technical', 'off_page')),

  -- What was affected
  target_type TEXT NOT NULL CHECK (target_type IN ('page', 'keyword', 'site', 'image')),
  target_id TEXT,
  target_url TEXT,

  -- Action details (flexible JSONB for different action types)
  action_details JSONB NOT NULL DEFAULT '{}',
  /* Example structures:
  Meta update: {
    "field": "meta_title",
    "oldValue": "Old Title",
    "newValue": "New SEO Title | Brand",
    "keywordTargeted": "best coffee austin"
  }
  Content published: {
    "contentType": "blog_post",
    "wordCount": 2500,
    "keywordsTargeted": ["coffee austin", "best coffee shops"],
    "internalLinks": ["/menu", "/locations"],
    "publishedUrl": "/blog/best-coffee-austin"
  }
  Backlink acquired: {
    "backlinkUrl": "https://example.com/article",
    "anchorText": "best coffee shop",
    "linkType": "guest_post",
    "domainAuthority": 45,
    "targetPage": "/locations/downtown"
  }
  */

  -- Effort tracking
  time_invested_minutes INTEGER DEFAULT 0,
  cost_dollars DECIMAL(10,2) DEFAULT 0,
  automated BOOLEAN DEFAULT false,
  performed_by TEXT DEFAULT 'user' CHECK (performed_by IN ('user', 'ai', 'automation')),

  -- Timestamps
  executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for seo_actions
CREATE INDEX idx_seo_actions_client_time ON seo_actions(client_id, executed_at DESC);
CREATE INDEX idx_seo_actions_target ON seo_actions(target_type, target_id);
CREATE INDEX idx_seo_actions_target_url ON seo_actions(target_url);
CREATE INDEX idx_seo_actions_category ON seo_actions(action_category);
CREATE INDEX idx_seo_actions_type ON seo_actions(action_type);

-- Table: seo_results
-- Stores measurable results (ranking changes, traffic increases, conversions)
CREATE TABLE IF NOT EXISTS seo_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Result classification
  result_type TEXT NOT NULL CHECK (result_type IN ('ranking_change', 'traffic_increase', 'conversion', 'backlink_gain')),

  -- What improved
  target_type TEXT NOT NULL CHECK (target_type IN ('keyword', 'page', 'site')),
  target_id TEXT,
  target_url TEXT,

  -- Metrics
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  previous_value DECIMAL(10,2),
  change_amount DECIMAL(10,2),
  change_percent DECIMAL(10,2),

  -- Traffic source tracking
  traffic_source TEXT, -- 'google_organic', 'chatgpt', 'perplexity', etc.
  source_details JSONB DEFAULT '{}',

  -- Timestamps
  measured_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for seo_results
CREATE INDEX idx_seo_results_client_time ON seo_results(client_id, measured_at DESC);
CREATE INDEX idx_seo_results_target ON seo_results(target_type, target_id);
CREATE INDEX idx_seo_results_target_url ON seo_results(target_url);
CREATE INDEX idx_seo_results_type ON seo_results(result_type);

-- Table: action_result_attributions
-- AI-generated connections between actions and results
CREATE TABLE IF NOT EXISTS action_result_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- The result
  result_id UUID REFERENCES seo_results(id) ON DELETE CASCADE,
  result_type TEXT NOT NULL,
  result_value DECIMAL(10,2),

  -- The contributing action
  action_id UUID REFERENCES seo_actions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,

  -- Attribution scoring
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  attribution_weight DECIMAL(3,2) CHECK (attribution_weight >= 0 AND attribution_weight <= 1),
  time_lag_days INTEGER,

  -- AI reasoning
  attribution_reasoning TEXT,
  correlation_strength TEXT CHECK (correlation_strength IN ('strong', 'moderate', 'weak', 'probable')),

  -- ROI calculation
  estimated_value_dollars DECIMAL(10,2),
  roi_multiple DECIMAL(10,2),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  calculated_by TEXT DEFAULT 'ai_attribution_engine'
);

-- Indexes for action_result_attributions
CREATE INDEX idx_attributions_result ON action_result_attributions(result_id);
CREATE INDEX idx_attributions_action ON action_result_attributions(action_id);
CREATE INDEX idx_attributions_client ON action_result_attributions(client_id);
CREATE INDEX idx_attributions_confidence ON action_result_attributions(confidence_score DESC);

-- Comments
COMMENT ON TABLE seo_actions IS 'Tracks all SEO actions taken (content, meta updates, backlinks, etc.)';
COMMENT ON TABLE seo_results IS 'Tracks measurable SEO results (rankings, traffic, conversions)';
COMMENT ON TABLE action_result_attributions IS 'AI-generated attributions connecting actions to results';

COMMENT ON COLUMN seo_actions.action_details IS 'Flexible JSONB field containing action-specific data';
COMMENT ON COLUMN seo_results.source_details IS 'Additional context about traffic source (e.g., AI platform details)';
COMMENT ON COLUMN action_result_attributions.confidence_score IS 'AI confidence that this action contributed (0-1)';
COMMENT ON COLUMN action_result_attributions.attribution_weight IS 'Percentage of result credit given to this action (0-1)';
